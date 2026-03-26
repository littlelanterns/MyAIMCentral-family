> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-31: Subscription Tier System

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup — `subscription_tiers`, `family_subscriptions`, `feature_access` tables, `useCanAccess()` hook), PRD-02 (Permissions & Access Control — `usePermission()`, `PermissionGate`, Permission Hub), PRD-03 (Design System — UI tokens), PRD-04 (Shell Routing — Settings overlay access), PRD-05C (LiLa Optimizer — `ai_usage_tracking` table, credit balance field), PRD-22 (Settings — Screen 10 Subscription & Billing stub), PRD-24 (Gamification — credit-earning celebration events), PRD-25 (Guided Dashboard — onboarding milestone definitions), PRD-32 (Admin Console — `ai_usage_log` table, `platform_usage_log` table)
**Created:** March 22, 2026
**Last Updated:** March 22, 2026

---

## Overview

PRD-31 is the monetization engine — the system that turns the `useCanAccess()` infrastructure wired into every feature across 38 PRDs into a real, configurable, revenue-generating subscription system. It defines four subscription tiers, Stripe payment integration, the Founding Family program, an AI credit system with earned-credits onboarding, per-use tier-sampling, and the admin tooling needed to make informed tier-gating decisions based on real usage data.

This PRD takes a deliberately data-driven approach to tier assignment. During beta, all features remain unlocked for all users. The system tracks every AI call's cost, every feature's usage frequency, and every family's engagement patterns. When beta ends and paid tiers activate, the admin has a comprehensive dashboard showing exactly which features cost what, which get used most, and which drive retention — enabling informed tier placement decisions rather than guesses. The actual feature-to-tier mapping is intentionally left as admin-configurable seed data, not hard-coded decisions.

The subscription system introduces a three-layer access model: (1) platform-level tier gating set by admin, with six role groups and per-role tier thresholds, (2) family-level member gating controlled by mom through an enhanced Permission Hub, and (3) the existing PRD-02 role-based granular permissions. This layered approach ensures that tier economics, parental control, and per-member fine-tuning each have their own clean surface.

> **Mom experience goal:** Subscription management should feel effortless and transparent. Mom should always know what she's paying, what she's getting, and what she'd get if she upgraded — without ever feeling pressured. The founding family experience should feel like being part of something special, not like being sold to.

---

## User Stories

### Subscription Management
- As a mom, I want to see my current plan, what it includes, and what I'm paying so I always know where I stand.
- As a mom, I want to upgrade my plan and get immediate access to new features so I don't have to wait.
- As a mom, I want to downgrade my plan without losing my data so I can adjust if my budget changes.
- As a mom, I want to manage my payment method and see my billing history so I have full control over my finances.
- As a mom, I want to generate an ESA-compliant invoice for my subscription so I can submit it for reimbursement.

### Founding Family
- As a founding family member, I want my discounted rate locked in permanently so I'm rewarded for being an early adopter.
- As a founding family member, I want to see my founding status and badge so I feel recognized.
- As a founding family member, I want my founding rate to survive tier changes so I can move between plans without penalty.
- As a founding family member, I want to complete onboarding milestones to activate my founding status so my commitment to the platform is reciprocated.

### AI Credits
- As a mom, I want to see how many AI actions I've used this month so I can pace my usage.
- As a mom, I want to purchase additional AI action credits when I need more so I'm never blocked from getting things done.
- As a mom, I want purchased credits to roll over so nothing I pay for goes to waste.
- As a mom on a lower tier, I want to try a higher-tier feature using credits so I can experience the value before committing to an upgrade.

### Earned Credits (Onboarding)
- As a new subscriber, I want to earn AI credits by completing setup milestones so I can try premium features as a reward for getting started.
- As a new subscriber, I want each milestone to feel like a celebration, not a chore, so the setup process is enjoyable.

### Admin
- As an admin, I want to see per-feature AI costs and usage frequency so I can make informed tier-gating decisions.
- As an admin, I want to assign features to tiers per role group with a simple visual interface so I can adjust monetization without code changes.
- As an admin, I want to manage founding family status, credit pack pricing, and tier configuration from the admin console so all monetization controls are centralized.

---

## The Four Tiers

### Tier Definitions

| Tier | Internal Name | Display Name | Monthly Price | Founding Rate |
|------|--------------|-------------|---------------|---------------|
| 1 | `essential` | Essential | $9.99 | $7.99 |
| 2 | `enhanced` | Enhanced | $16.99 | $13.99 |
| 3 | `full_magic` | Full Magic | $24.99 | $20.99 |
| 4 | `creator` | Creator | $39.99 | $34.99 |

> **Decision rationale:** Prices are clean numbers under psychological barriers ($10/$17/$25/$40). Founding discounts use a growing dollar model ($2/$3/$4/$5 off) so the discount grows with commitment level. Monthly billing only at launch — annual billing is a future addition (particularly valuable for ESA families with lump-sum funding).

### Tier Descriptions

**Essential ($9.99/mo):** Mom's personal command center. Personal growth features (Guiding Stars, Best Intentions, Journal, Smart Notepad, LifeLantern), LiLa Help and Assist, context-only family information for LiLa conversations. Mom-only account — no connected family members.

**Enhanced ($16.99/mo):** Connected family. Family Login Name, member dashboards, PIN login, Special Adult invites, family hub, most AI features including the LiLa Optimizer. The tier where MyAIM becomes a family platform, not just a personal tool.

**Full Magic ($24.99/mo):** Everything unlocked. Advanced AI features (system design, Friction Detective, advanced reporting), unlimited additional adults, all gamification systems, full BookShelf capabilities.

**Creator ($39.99/mo):** Full Magic plus future creator-specific tools. At launch, Creator tier shows Planned Expansion Cards (PRD-32A) for features in development: AI branding modules, business plan creation, business idea validation, workflow design for entrepreneurs. Each card includes a "What would you hope this includes?" freeform input to gather direct user input on Creator tier value.

> **Decision rationale:** Creator is intentionally a placeholder. Real creator features will be designed based on demand validation data from Planned Expansion Cards and direct user feedback. Selling the tier at launch with honest "in development" cards and a freeform input is more authentic than inventing features to fill a price point. The tier exists in the pricing table so founding families can lock in their Creator rate if they anticipate wanting it.

### Annual Billing (Future Stub)

Annual billing is not available at launch. The `subscription_tiers` table includes `price_yearly` column (NULL at launch). When annual billing is added, it will be configured via admin settings with a configurable discount (likely 2 months free for standard pricing, TBD for founding rates). The Stripe integration supports both billing intervals — adding annual is a configuration change, not a rebuild.

> **Decision rationale:** Monthly-only at launch reduces complexity and provides an exit route while building confidence in the product and business. Annual billing for ESA families is a high-priority post-launch addition.

---

## The Three-Layer Access Model

### Layer 1: Platform-Level Tier Gating (Admin Console)

What the subscription tier ALLOWS. Configured by admin in the Tier Assignment Screen (Screen 4 in this PRD). Sets the ceiling for every feature across six role groups.

**Six role groups:**
1. **Mom / Primary Parent** — always has the most access
2. **Dad / Additional Adults** — spouse, co-parent
3. **Special Adults** — caregivers, grandparents (shift-scoped)
4. **Independent Teens** — 13+ with their own login
5. **Guided Kids** — younger children with simplified UI
6. **Play Kids** — youngest children with visual/tile-based UI

Each feature key gets a tier threshold per role group: Essential, Enhanced, Full Magic, Creator, or **Never** (not available at any tier for this role type). Marking the lowest tier auto-inherits upward — if a feature is marked Enhanced for Mom, it's also available at Full Magic and Creator.

Where a feature has a lite version for a younger group (e.g., Write Drawer for Guided kids instead of full Smart Notepad), the lite version is registered as a separate feature key with its own tier assignments.

### Layer 2: Family-Level Member Gating (Permission Hub Enhancement)

What mom ACTIVATES for her specific family members. An enhancement to PRD-02's existing Permission Hub. Mom sees a grid with family member columns and feature rows. Each cell reflects both the tier ceiling and mom's toggle:

- **Enabled** — Tier allows it AND mom has turned it on
- **Disabled by mom** — Tier allows it but mom has toggled it off (one tap to enable)
- **Locked by tier** — Tier doesn't allow this for this role type; shows which tier unlocks it
- **Not available** — Feature is "Never" for this member type at any tier

Tapping an enabled feature row expands to show PRD-02's granular per-child access controls (none/view/contribute/manage) for kid-scoped features.

### Layer 3: Role-Based Permissions (PRD-02 — Existing)

The existing `usePermission()` / `PermissionGate` system. Unchanged by this PRD. Provides granular per-member, per-feature, per-child access levels.

### Access Check Flow

```
useCanAccess(featureKey, memberId?) → boolean

1. Get family's tier from family_subscriptions
2. Check founding family override:
   - families.is_founding_family = true
   - family_subscriptions.status = 'active'
   - founding_onboarding_complete = true
   → If all true, return true (all features unlocked)
3. Determine member's role group from family_members.role + dashboard_mode
4. Look up feature_access_v2 record for (tier_id, featureKey, role_group)
5. If role_group threshold is 'never', return false
6. If family's tier >= role_group threshold, check mom's per-member toggle
   - Look up member_feature_toggles for (family_id, member_id, featureKey)
   - If toggle exists and is false, return false
   - If no toggle exists, default to true (enabled by default when tier allows)
7. Return true
```

> **Decision rationale:** Default-enabled when tier allows prevents mom from needing to manually enable every feature for every member on upgrade. She only toggles OFF what she doesn't want. This matches the buffet principle — maximalist options, minimalist defaults.

---

## Screens

### Screen 1: Plan Comparison (Settings → Subscription & Billing)

**What the user sees (mom only):**

This replaces the PRD-22 Screen 10 stub. Accessible from Settings overlay.

```
┌─────────────────────────────────────────────────────────┐
│  ← Subscription & Billing                                │
│  ───────────────────────────────────────────────────── │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ✨ Founding Family · Enhanced                     │  │
│  │  Founding rate: $13.99/mo (saves $3/mo forever)   │  │
│  │  Member since: March 2026                          │  │
│  │  Status: Active · Next billing: April 22           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ───────────────────────────────────────────────────── │
│  Compare Plans                                          │
│  ───────────────────────────────────────────────────── │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Essential │ │ Enhanced │ │Full Magic│ │ Creator  │  │
│  │ $9.99/mo │ │$16.99/mo │ │$24.99/mo │ │$39.99/mo │  │
│  │          │ │ ★ YOU    │ │          │ │          │  │
│  │ Mom-only │ │Connected │ │Everything│ │Full Magic│  │
│  │ personal │ │ family   │ │ unlocked │ │+ creator │  │
│  │ features │ │ platform │ │          │ │  tools   │  │
│  │          │ │          │ │          │ │          │  │
│  │[See what's│ │[Current] │ │[Upgrade] │ │[Upgrade] │  │
│  │ included]│ │          │ │          │ │          │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│  Founding Family Rates:                                 │
│  $7.99 · $13.99 · $20.99 · $34.99                     │
│  Your founding rate is locked in forever.               │
│                                                         │
│  ───────────────────────────────────────────────────── │
│  AI Actions This Month                                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ████████████░░░░░░░░  47 / ∞ used               │  │
│  │  (Beta: unlimited)                                 │  │
│  │                                                    │  │
│  │  [Purchase More AI Actions]                        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ───────────────────────────────────────────────────── │
│  Credits Balance: 15 AI actions                         │
│  (10 earned · 5 purchased · 0 expiring soon)           │
│  ───────────────────────────────────────────────────── │
│                                                         │
│  [Manage Payment Method]   → opens Stripe Portal       │
│  [Billing History]         → opens Stripe Portal       │
│  [Generate ESA Invoice]    → opens PRD-28B invoice     │
│  [Cancel Subscription]     → confirmation flow         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Interactions:**
- [See what's included] on any plan card → expands to show feature list for that tier (pulled from `feature_access_v2` data).
- [Upgrade] → Stripe Checkout for the new tier. Prorated charge. Immediate access.
- [Current] → no action (visual indicator only).
- [Manage Payment Method] / [Billing History] → opens Stripe Customer Portal in a new tab.
- [Generate ESA Invoice] → navigates to PRD-28B ESA Invoice Generator, pre-populated with current billing period.
- [Purchase More AI Actions] → opens Screen 2 (Credit Packs).
- [Cancel Subscription] → opens Screen 3 (Cancellation Flow).
- Founding Family badge and savings are always visible when applicable.

**Founding family display variations:**
- If founding AND onboarding complete: shows full founding badge + locked rate.
- If founding BUT onboarding incomplete: shows founding badge + message: "Complete your founding family setup to lock in your special rates! [X of 10 milestones done →]"
- If not founding: no badge, standard pricing shown.

**Data read:**
- `family_subscriptions` (tier, status, founding info, period dates)
- `families` (is_founding_family, founding_onboarding_complete)
- `subscription_tiers` (pricing, descriptions)
- `ai_credits` (current balance, sources, expiration)
- `ai_usage_log` aggregated for current billing period

---

### Screen 2: Credit Packs

**What the user sees:**

A modal or drawer accessed from the AI actions section on Screen 1 or from the usage thermometer widget anywhere in the app.

```
┌─────────────────────────────────────────────────────────┐
│  Purchase AI Actions                               ✕    │
│  ───────────────────────────────────────────────────── │
│                                                         │
│  Current balance: 15 AI actions                         │
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │   Starter   │ │   Bundle    │ │   Power     │      │
│  │             │ │             │ │             │      │
│  │  25 actions │ │ 100 actions │ │ 300 actions │      │
│  │   $1.99     │ │   $4.99     │ │   $12.99    │      │
│  │             │ │   POPULAR   │ │   BEST      │      │
│  │  ($0.08/ea) │ │  ($0.05/ea) │ │  ($0.04/ea) │      │
│  │             │ │             │ │   VALUE     │      │
│  │  [Purchase] │ │  [Purchase] │ │  [Purchase] │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                         │
│  Purchased credits never expire and roll over           │
│  month to month. Nothing goes to waste.                 │
│                                                         │
│  What counts as an AI action?                           │
│  LiLa Optimizer requests, LifeLantern questions,       │
│  ThoughtSift turns, report generation, system           │
│  design sessions, and other AI-powered features.        │
│  Routine operations (auto-tagging, Help mode,           │
│  basic search) are always free.                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Interactions:**
- [Purchase] → Stripe Checkout for a one-time payment. On success, credits are added to the family's `ai_credits` ledger with `source = 'purchased'` and `expires_at = NULL`.
- Pack sizes and prices are stored in the `credit_packs` table (admin-configurable).

**Data created:**
- `ai_credits` ledger entry on successful purchase

---

### Screen 3: Cancellation Flow

**What the user sees:**

A multi-step confirmation accessible from Screen 1.

**Step 1 — "We'll miss you":**
- Shows what the family will lose access to (feature count at their current tier vs. what they'd keep if they hadn't subscribed).
- If founding family: prominent warning — "Cancelling will permanently end your founding family status and locked-in rates. This cannot be undone."
- [I'd like to stay →] (returns to Screen 1)
- [Continue to cancel →]

**Step 2 — Optional feedback:**
- "Help us understand — why are you cancelling?"
- Multi-select options: Too expensive, Not using it enough, Missing features I need, Found something better, Taking a break, Other.
- Optional freeform text field.
- [Submit & Cancel] / [I changed my mind →]

**Step 3 — Confirmation:**
- "Your subscription will remain active until [end of current billing period]. After that, your account will be downgraded to a free read-only mode."
- "Your data is never deleted. If you resubscribe, everything will be here waiting for you."
- If founding family: "Your founding family rates will not be available if you resubscribe later."
- [Done]

**Data created:**
- Cancellation reason stored in `subscription_cancellations` table.
- Stripe subscription set to cancel at period end.
- `family_subscriptions.status` updated to 'cancelled' (access continues until period end).

> **Decision rationale:** Cancellation takes effect at end of period, not immediately. Mom already paid for the current month. Stripe handles this natively. The multi-step flow with feedback gathers valuable churn data without being manipulative — no dark patterns, no "are you SURE?" guilt trips.

---

### Screen 4: Tier Assignment (Admin Console — New Tab Section)

**What the admin sees:**

A new section within the Admin Console, accessible from the existing tab navigation. This is the master control panel for which features are available at which tier for which role groups.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tier Assignment                                                              │
│  ─────────────────────────────────────────────────────────────────────────── │
│  [Search features...]  [Filter: All ▾]  [Collapse All]  [Save & Apply]      │
│  ─────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│  ┌─── PERSONAL GROWTH ──────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │  Feature              │ Avg Cost │ Monthly │  Mom  │Dad/A│ SA  │ IT  │ GK │ PK │
│  │                       │ /use     │ Uses    │      │     │     │     │    │    │
│  │  ─────────────────────┼──────────┼─────────┼──────┼─────┼─────┼─────┼────┼────│
│  │  Guiding Stars        │  $0.00   │  847    │  ◉E  │ ◉En │  ✕  │ ◉En │◉En│ ✕  │
│  │  Best Intentions      │  $0.01   │  623    │  ◉E  │ ◉En │  ✕  │ ◉En │ ✕ │ ✕  │
│  │  Journal              │  $0.00   │  2,341  │  ◉E  │ ◉En │  ✕  │ ◉En │ ✕ │ ✕  │
│  │  Write Drawer (Guided)│  $0.00   │  412    │  —   │  —  │  —  │  —  │◉En│ ✕  │
│  │  Smart Notepad        │  $0.02   │  1,156  │  ◉E  │ ◉En │  ✕  │ ◉En │ ✕ │ ✕  │
│  │  LifeLantern          │  $0.04   │  234    │  ◉En │ ◉FM │  ✕  │ ◉FM │ ✕ │ ✕  │
│  │  InnerWorkings        │  $0.00   │  189    │  ◉E  │ ◉En │  ✕  │ ◉En │ ✕ │ ✕  │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─── AI FEATURES ──────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │  LiLa Optimizer       │  $0.03   │  1,892  │  ◉En │ ◉FM │  ✕  │ ◉C │ ✕ │ ✕  │
│  │  LiLa General Chat    │  $0.02   │  3,456  │  ◉E  │ ◉En │  ✕  │ ◉En│ ✕ │ ✕  │
│  │  ThoughtSift          │  $0.05   │  345    │  ◉En │ ◉FM │  ✕  │  ✕ │ ✕ │ ✕  │
│  │  AI Vault Browse      │  $0.00   │  1,234  │  ◉E  │ ◉En │  ✕  │ ◉En│ ✕ │ ✕  │
│  │  AI Vault Comments    │  $0.00   │  567    │  ◉E  │  ✕  │  ✕  │  ✕ │ ✕ │ ✕  │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Legend: ◉E=Essential  ◉En=Enhanced  ◉FM=Full Magic  ◉C=Creator  ✕=Never    │
│  Tap any cell to cycle: E → En → FM → C → ✕ → E                            │
│  Columns: Mom | Dad/Adults | Special Adults | Ind. Teens | Guided | Play    │
│                                                                              │
│  [Save & Apply]  [Revert to Saved]  [Export as CSV]                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Key elements:**
- **Avg Cost /use:** Average estimated cost per use of this feature, calculated from `ai_usage_log` data. Features with $0.00 cost are purely JavaScript/database operations.
- **Monthly Uses:** Total platform-wide uses in the current month, from `platform_usage_log`.
- **6 role group columns:** Each cell is a tappable dot selector that cycles through E → En → FM → C → ✕ (Never). The selected value represents the LOWEST tier where this role group gains access; all tiers above auto-inherit.
- **Feature grouping:** Collapsible category sections (Personal Growth, AI Features, Family Tools, Dashboards & Views, Gamification, Admin & Settings, etc.).
- **Search:** Filters the feature list by name or key.
- **Save & Apply:** Writes all changes to `feature_access_v2` table. Changes take effect immediately for all families.

**Interactions:**
- Tap any role-group cell → cycles through tier options with visual feedback.
- Features where a lite version exists show both the full version and the lite version as separate rows (e.g., "Smart Notepad" and "Write Drawer (Guided)").
- [Export as CSV] downloads the complete feature-tier mapping for offline review.
- Unsaved changes are indicated by a yellow highlight on modified cells.
- [Revert to Saved] discards all unsaved changes.

**Data read:**
- `feature_access_v2` table (current tier assignments)
- `ai_usage_log` aggregated by feature (average cost per use)
- `platform_usage_log` aggregated by feature (monthly usage count)
- `feature_key_registry` (feature names, descriptions, categories)

**Data created/updated:**
- `feature_access_v2` rows on Save & Apply

---

### Screen 5: Usage Thermometer Widget

**What the user sees:**

A small widget available on mom's dashboard (via PRD-10 widget system) and displayed inline on the Subscription & Billing screen.

```
┌───────────────────────────────────┐
│  AI Actions This Month            │
│  ████████████░░░░░░░░  47 / 100   │
│  Resets April 22                   │
│  [+ Get More]                      │
└───────────────────────────────────┘
```

During beta: shows usage count with "∞" as the limit and "(Beta: unlimited)" label.

Post-beta: shows usage against the tier's allotment. Changes color as usage approaches the limit — green (0-60%), amber (60-85%), red (85-100%).

When tapped, expands to show:
- Breakdown by feature (which features consumed the most AI actions)
- Credit balance (purchased + earned, with expiration dates on earned credits)
- [Purchase More] button
- [View usage history] link

**Data read:**
- `ai_usage_log` aggregated for current billing period for this family
- `ai_credits` ledger for current balance
- `subscription_tiers` for monthly allotment

---

### Screen 6: Tier-Sampling Modal

**What the user sees:**

When a user on a lower tier attempts to access a feature above their tier, and they have AI credits available:

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ✨ Try This Feature                                     │
│                                                          │
│  LiLa Optimizer is a Full Magic feature.                │
│  You're on Enhanced.                                     │
│                                                          │
│  Use 5 AI actions to try it once?                       │
│                                                          │
│  Your balance: 15 AI actions                             │
│                                                          │
│  [Try It (5 actions)]     [Not Now]                     │
│                                                          │
│  Upgrade to Full Magic for unlimited access →            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

When the user has NO credits:

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ✨ This is a Full Magic Feature                         │
│                                                          │
│  LiLa Optimizer is available with Full Magic.           │
│                                                          │
│  [See Full Magic Features]    [Get AI Actions]           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Interactions:**
- [Try It (5 actions)] → deducts credits from `ai_credits` ledger, grants single-session access to the feature. The feature opens normally. When the session ends (conversation closes, report generates, etc.), access reverts.
- [Not Now] → closes modal, returns to previous screen.
- [Get AI Actions] → opens Screen 2 (Credit Packs).
- [See Full Magic Features] / upgrade link → navigates to Screen 1 (Plan Comparison).

**How "single session" works per feature type:**
- **LiLa conversation modes** (Optimizer, ThoughtSift, etc.): One conversation. When the conversation is closed or a new one is started, access reverts.
- **Report generation** (PRD-28B): One report generation. After the report is produced, access reverts.
- **BookShelf extraction** (PRD-23): One book extraction session. After extraction completes, access reverts.
- **BigPlans system design** (PRD-29): One plan creation session. After the plan is saved, access reverts. The created plan and its deployed components remain functional.

The cost per tier-sample (5 AI actions in the example) is admin-configurable per feature key in the `tier_sampling_costs` table.

**Data created:**
- `ai_credits` deduction entry with `type = 'tier_sample'`
- `tier_sample_sessions` record tracking what was sampled (for analytics: which features get sampled most = strongest upgrade signals)

---

### Screen 7: Permission Hub Enhancement (Cross-PRD with PRD-02)

**What the user sees (mom only):**

This is an enhancement to PRD-02's existing Permission Hub, not a new standalone surface. Accessible from Settings → Family Management → Permissions.

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Feature Access                Your plan: Enhanced            │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  [Quick Setup: Apply Preset ▾]                                  │
│                                                                  │
│                    David   Emma    Jake   Gideon  Ruthie        │
│                    (Dad)  (Teen) (Guided)(Guided) (Play)        │
│  ── FAMILY TOOLS ──────────────────────────────────────────── │
│  Tasks & Routines   [✓]    [✓]    [✓]    [✓]     [ ]          │
│  Calendar           [✓]    [✓]    [✓]    [✓]     [✓]          │
│  Messages           [✓]    [✓]    [✓]    [ ]      ···          │
│  Family Hub         [✓]    [✓]    [✓]    [✓]     [✓]          │
│  ── PERSONAL GROWTH ───────────────────────────────────────── │
│  Journal            [✓]    [✓]     ···    ···      ···          │
│  Write Drawer        —      —     [✓]    [✓]      ···          │
│  Guiding Stars      [✓]    [✓]    [ ]     ···      ···          │
│  Best Intentions    [✓]    [✓]     ···    ···      ···          │
│  ── AI FEATURES ───────────────────────────────────────────── │
│  LiLa Optimizer      🔒     🔒      ···    ···      ···          │
│  LiLa General Chat  [✓]    [✓]     ···    ···      ···          │
│  AI Vault Browse      🔒     🔒      ···    ···      ···          │
│  ── GAMIFICATION ──────────────────────────────────────────── │
│  Gamification         —      —     [✓]    [✓]     [✓]          │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  [✓] Enabled    [ ] Disabled by you    🔒 Full Magic             │
│  ··· Not available     — Different member type                   │
│                                                                  │
│  Tap any row to see detailed controls for that member ▸         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Interactions:**
- Tap [✓] or [ ] → toggles the feature on/off for that member. Writes to `member_feature_toggles`.
- Tap 🔒 → shows small info card: "LiLa Optimizer is available with Full Magic ($24.99/mo). [See what's included →]" Not pushy — informational only.
- Tap an enabled feature row → expands to show PRD-02's granular per-child access controls (none/view/contribute/manage) for that member's access to each child's data within that feature.
- [Quick Setup: Apply Preset ▾] → dropdown of PRD-02 system presets (Full Partner, Active Helper, Observer, Babysitter, Grandparent, Tutor). Selecting one sets all feature toggles according to the preset definition.
- Horizontal scroll on mobile for large families.
- Features grouped by category with collapsible section headers.

**Data read:**
- `feature_access_v2` (tier ceiling per role group)
- `member_feature_toggles` (mom's per-member on/off decisions)
- `family_subscriptions` (current tier)
- `family_members` (names, roles, dashboard modes)

**Data created/updated:**
- `member_feature_toggles` on toggle change

---

## Founding Family Program

### Overview

The first 100 families to subscribe receive Founding Family status: permanently locked discounted pricing, a Founding Family badge, and all features unlocked (regardless of tier) as long as their subscription remains active and they've completed onboarding milestones.

### Two-Stage Activation

**Stage 1 — Enrollment:**
- Family subscribes during the founding window (first 100 spots).
- `families.is_founding_family` set to `true`.
- `families.founding_onboarding_complete` set to `false`.
- All features unlocked immediately (beta mode).
- Founding badge visible in profile and on Subscription & Billing screen.

**Stage 2 — Activation:**
- Family completes all 10 onboarding milestones (same list as earned credits, but no credits awarded to founding families).
- `families.founding_onboarding_complete` set to `true`.
- Founding discount rates are now permanently locked.
- When beta ends and paid tiers activate, founding families on any tier pay their founding rate.

**Grace period:** When paid tiers go live, founding families who have NOT yet completed all milestones receive a 30-day grace window. During this period, they retain full access and see a warm prompt on their dashboard: "Complete your founding family setup to lock in your special rates! [X of 10 milestones done →]" After 30 days, if milestones are still incomplete, the family keeps `is_founding_family = true` but loses the all-features-unlocked override and the locked founding rates — they're treated as a normal subscriber on their current tier. Completing milestones after the grace period does NOT restore founding benefits.

> **Decision rationale:** The grace period respects that busy moms may not have completed onboarding before tiers go live. 30 days is generous but finite. The milestone completion requirement ensures founding families have genuinely set up and experienced the platform, not just grabbed a spot.

### Founding Status Durability

| Event | Founding Status |
|-------|----------------|
| Tier upgrade (Enhanced → Full Magic) | Preserved. Founding rate recalculates for new tier. |
| Tier downgrade (Full Magic → Essential) | Preserved. Founding rate recalculates for new tier. |
| Payment method update | Preserved. |
| Payment failure (`past_due` up to 14 days) | Preserved. Grace period. |
| Payment failure beyond 14 days | **Lost permanently.** |
| Explicit cancellation | **Lost permanently.** |
| Re-subscribe after cancellation | Normal pricing. Founding status cannot be restored. |
| Account pause (not currently offered) | N/A — future feature if needed. |

### Founding Family Counter

The admin console shows a live counter: "Founding Families: 47 / 100 claimed." When all 100 spots are filled, the founding window closes automatically — new subscribers get standard pricing.

The public blog (PRD-38) and future marketing pages show the counter when the founding window is open: "Only [X] founding family spots remaining."

---

## AI Credits System

### Credit Types and Ledger

All credit types use the same unit: **AI actions.** One AI action = one Sonnet-level operation. Haiku-level operations (Help mode, auto-tagging, extraction, classification) are free and never deducted.

The `ai_credits` table is an append-only ledger. Every credit event (earn, spend, purchase, expiration, monthly allotment) is a row. The current balance is calculated from the ledger sum (credits_added - credits_spent where not expired).

**Credit sources:**

| Source | Expires? | Notes |
|--------|----------|-------|
| `tier_monthly_allotment` | End of billing period (use-it-or-lose-it) | Auto-granted on billing cycle start. Amount is admin-configurable per tier. |
| `purchased` | Never | From credit pack purchases. Roll over indefinitely. |
| `earned_onboarding` | 90 days from earning | From completing onboarding milestones. |
| `earned_promotion` | Admin-configured | Future: promotional credits, referral bonuses, etc. |

**Spending priority:** When credits are consumed, the system spends in this order:
1. Credits expiring soonest (prevents waste)
2. Monthly allotment (use before it resets)
3. Earned credits (before they expire)
4. Purchased credits (never expire, spent last)

### Monthly Allotments (Placeholder — Admin-Configurable)

| Tier | Placeholder Allotment | Notes |
|------|----------------------|-------|
| Essential | 30 AI actions/mo | TBD — tuned from beta usage data |
| Enhanced | 100 AI actions/mo | TBD — tuned from beta usage data |
| Full Magic | 300 AI actions/mo | TBD — tuned from beta usage data |
| Creator | 500 AI actions/mo | TBD — tuned from beta usage data |

These numbers are stored in the `subscription_tiers` table as `monthly_ai_allotment` (INTEGER, admin-editable). During beta, allotments are set to 99999 (effectively unlimited). When tiers activate, admin adjusts based on actual P90 usage data from beta families.

> **Decision rationale:** Setting the infrastructure with placeholder values ensures the system is ready to enforce limits when needed, while the actual numbers are informed by real data rather than guesses. The admin can adjust allotments at any time without code changes.

### Credit Pack Pricing (Admin-Configurable)

| Pack | AI Actions | Price | Per-Action Cost |
|------|-----------|-------|-----------------|
| Starter | 25 | $1.99 | $0.08 |
| Bundle | 100 | $4.99 | $0.05 |
| Power | 300 | $12.99 | $0.04 |

Pack definitions are stored in the `credit_packs` table (admin-editable). New packs can be added, existing packs can be deactivated — no code changes needed.

### What Counts as an AI Action

An AI action is deducted when a Sonnet-level (or equivalent-cost) AI call is made on behalf of the user. The deduction happens at the Edge Function level — after the AI call succeeds, the function logs the usage and decrements the credit balance.

**Counted (1 AI action each):**
- LiLa Optimizer optimization (the 20% that hit Sonnet)
- LiLa General Chat turn (Sonnet)
- ThoughtSift conversation turn
- LifeLantern assessment question
- BigPlans system design turn
- Safe Harbor conversation turn
- Report generation (AI-enhanced reports)
- BookShelf extraction per chapter
- Family Vision Quest synthesis
- Celebration generation (Sonnet)
- Cyrano / Higgins conversation turns

**NOT counted (free, unlimited):**
- LiLa Help mode (Haiku, FAQ pattern-matching)
- LiLa Assist mode (Haiku, guidance)
- Auto-tagging (embedding-based, P2 pattern)
- Context learning detection (embedding delta, P3 pattern)
- Review & Route extraction (Haiku)
- Template-based Optimizer optimizations (JavaScript, 80% of requests)
- Whisper transcription
- Embedding generation
- Any operation using patterns P1-P9 that avoid API calls entirely

> **Decision rationale:** Metering only Sonnet-level operations keeps the system simple and avoids penalizing users for routine automated operations that cost fractions of a penny. The 80/20 architecture means most interactions are free — the meter only ticks on genuinely costly operations.

---

## Earned Credits Onboarding

### Philosophy

Instead of a traditional free trial, MyAIM rewards new subscribers with AI credits as they complete onboarding milestones. Each milestone makes the product stickier by building personalization and context. By the time a user has earned all credits, she's invested enough in setup that the product is genuinely valuable to her — not because of a calendar deadline, but because her life is in it.

Credits earned through onboarding can be used to try above-tier features via the tier-sampling system, creating a natural "taste before you commit" upgrade path.

> **Founding families complete the same milestones for founding status activation but receive no credits — they already have full access.**

### Milestone List

10 milestones, each earning 5 AI actions (50 total). Milestones are tracked in `onboarding_milestones` table. Completion triggers a celebration animation (PRD-24 gamification event) and a credit award toast.

| # | Milestone | Trigger | PRD Source |
|---|-----------|---------|------------|
| 1 | Create your account | Account creation completes | PRD-01 |
| 2 | Describe your family | Bulk add flow completes with 1+ members | PRD-01 |
| 3 | Set your first Guiding Star | First `guiding_stars` record created | PRD-06 |
| 4 | Write your first entry | First `journal_entries` record created (any entry type) | PRD-08 |
| 5 | Create your first task or routine | First `tasks` record created | PRD-09A |
| 6 | Add context to a child's Archive | First Archive item added for any child | PRD-13 |
| 7 | Have your first LiLa conversation | First LiLa conversation completed (any mode) | PRD-05 |
| 8 | Create your first Best Intention | First `best_intentions` record created | PRD-06 |
| 9 | Run the Family Friction Finder | Friction diagnosis conversation completed | PRD-29 |
| 10 | Complete your first LifeLantern section | First LifeLantern area marked complete | PRD-12A |

**Earned credits expire 90 days from earning.** The thermometer widget shows earned credits with their expiration dates. A gentle notification appears 7 days before expiration: "You have 10 AI actions expiring next week — use them to try something new!"

> **Decision rationale:** 10 milestones at 5 credits each = 50 AI actions total. At credit pack pricing (~$0.05/action), that's roughly $2.50 in value — enough to meaningfully sample premium features but not so much that it replaces the need for a subscription. Each milestone builds stickiness through personalization.

---

## Stripe Integration

### Checkout Flow

New subscriptions are created via Stripe Checkout (hosted page). Mom selects a tier on the Plan Comparison screen → redirected to Stripe Checkout → completes payment → redirected back to MyAIM with active subscription.

Stripe Checkout handles:
- Card payments, Apple Pay, Google Pay, Link (Stripe's one-click payment)
- Tax calculation and collection
- Receipt generation
- SCA/3DS authentication when required

> **Forward note:** PayPal and Venmo support within Stripe Checkout requires Stripe account configuration but no additional code. Admin enables these in the Stripe Dashboard.

### Webhook Events

A single Supabase Edge Function (`stripe-webhook-handler`) processes all Stripe webhook events:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create/update `family_subscriptions` record. Set tier, status='active', period dates. If founding window open and spot available, set founding family status. Grant initial monthly AI allotment. |
| `customer.subscription.updated` | Update tier, period dates, status. Recalculate founding rates if tier changed. |
| `customer.subscription.deleted` | Set status='cancelled'. If `is_founding_family`, set `founding_family_lost_at` timestamp. Clear founding override. |
| `invoice.payment_failed` | Set status='past_due'. Start 14-day grace timer. Send notification to mom via PRD-15 notification system. |
| `invoice.paid` | Set status='active'. Clear past_due status. Grant monthly AI allotment for new period. |

### Customer Portal

Stripe's hosted Customer Portal handles:
- Payment method updates
- Billing history / receipt downloads
- Subscription cancellation (also available from Screen 3 in-app)

Accessed via a button on Screen 1 that generates a Stripe Portal session URL.

### Upgrade / Downgrade

**Upgrade:** Immediate. Stripe creates a prorated invoice for the remainder of the billing period at the new tier's rate. `family_subscriptions.tier_id` updated immediately. All features at the new tier become available. Monthly AI allotment adjusts (prorated for remaining period).

**Downgrade:** End of period. Stripe schedules the tier change for the next billing cycle. Mom retains current-tier access until period end. `family_subscriptions` updated with `pending_tier_id` to show the upcoming change. Features above the future tier show a "Available until [date]" indicator.

---

## Edge Cases

### Founding Family Spot Race Condition
Two families attempt to claim the last founding spot simultaneously. Resolution: the `founding_family_counter` is incremented atomically in a database transaction. The first transaction to commit gets the spot. The second sees the counter at 100 and receives standard pricing. The Stripe webhook handler checks the counter before setting founding status.

### Credit Balance Goes Negative
Should never happen — the system checks balance before deducting. If a race condition causes negative balance (two simultaneous AI calls), the balance is allowed to go negative but further AI actions are blocked until balance is positive. No debt collection — the negative balance resolves on next allotment or purchase.

### Tier Downgrade While Using Above-Tier Feature
If mom is in the middle of a ThoughtSift conversation and her tier downgrades (end of period), the current conversation is allowed to complete. New conversations in that feature are blocked until upgrade or credit spend.

### Founding Family Completes Milestones After Grace Period
If a founding family misses the 30-day post-tiers-activation grace period, completing milestones later does NOT restore founding benefits. The family remains flagged as `is_founding_family = true` (historical record) but `founding_onboarding_complete` stays `false` and the founding override logic doesn't trigger.

### Free Read-Only Mode After Cancellation
When a subscription is cancelled and the period ends, the family enters a "free read-only" mode: all data is preserved and viewable, but no new content can be created, no AI features are available, and no family member logins work. Mom can resubscribe at any time to restore full access at standard (non-founding) pricing.

### ESA Invoice Amount
The ESA invoice (PRD-28B) pulls the actual amount charged from `family_subscriptions`. For founding families, this is the founding rate, not the standard rate. The invoice description remains the same regardless of pricing tier.

### Tier-Sample Session Tracking
If mom uses a tier-sample to access the Optimizer and the Optimizer conversation triggers a context learning detection (which would be a Haiku call, normally free), the context learning call is still free — only Sonnet-level calls within the sampled feature count against the session.

---

## Data Schema

### Modified Table: `subscription_tiers` (PRD-01 — Updated)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| name | TEXT | | NOT NULL | Enum: 'essential', 'enhanced', 'full_magic', 'creator' |
| display_name | TEXT | | NOT NULL | User-facing name |
| price_monthly | DECIMAL | | NOT NULL | Standard monthly price |
| price_yearly | DECIMAL | | NULL | **NEW:** NULL at launch. Annual price when available. |
| founding_discount | DECIMAL | | NOT NULL | **NEW:** Dollar amount off monthly price for founding families |
| monthly_ai_allotment | INTEGER | 99999 | NOT NULL | **NEW:** AI actions per month. 99999 during beta. |
| description | TEXT | | NOT NULL | Tier description |
| features_summary | TEXT[] | '{}' | NOT NULL | **NEW:** Array of feature highlight strings for plan comparison cards |
| sort_order | INTEGER | | NOT NULL | **NEW:** Display order (1-4) |
| is_active | BOOLEAN | true | NOT NULL | Whether this tier is available for new subscriptions |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | **NEW:** Auto-trigger |

### Modified Table: `family_subscriptions` (PRD-01 — Updated)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families (unique) |
| tier_id | UUID | | NOT NULL | FK → subscription_tiers |
| status | TEXT | 'active' | NOT NULL | Enum: 'active', 'cancelled', 'past_due', 'trialing' |
| is_founding_family | BOOLEAN | false | NOT NULL | Mirrors families.is_founding_family for query convenience |
| founding_rate_monthly | DECIMAL | null | NULL | Locked founding rate (null if not founding) |
| founding_rate_yearly | DECIMAL | null | NULL | Locked founding rate (null if not founding) |
| stripe_customer_id | TEXT | null | NULL | **NEW:** Stripe customer ID |
| stripe_subscription_id | TEXT | null | NULL | **NEW:** Stripe subscription ID |
| pending_tier_id | UUID | null | NULL | **NEW:** Tier change scheduled for next billing period (downgrade) |
| current_period_start | TIMESTAMPTZ | now() | NOT NULL | |
| current_period_end | TIMESTAMPTZ | null | NULL | Null during beta (no expiry) |
| cancelled_at | TIMESTAMPTZ | null | NULL | **NEW:** When cancellation was requested |
| past_due_since | TIMESTAMPTZ | null | NULL | **NEW:** When payment failure started (for 14-day grace tracking) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

### Modified Table: `families` (PRD-01 — Updated)

Add columns:

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| founding_onboarding_complete | BOOLEAN | false | NOT NULL | **NEW:** All 10 milestones done |
| founding_onboarding_grace_deadline | TIMESTAMPTZ | null | NULL | **NEW:** 30 days after tiers go live. NULL during beta. |
| founding_family_lost_at | TIMESTAMPTZ | null | NULL | **NEW:** When founding status was lost (cancellation/non-payment). NULL if active or never-founding. |

### Replaced Table: `feature_access_v2` (Replaces PRD-01 `feature_access`)

The original `feature_access` table (PRD-01) had a single `enabled` boolean per (tier, feature_key). This is replaced by `feature_access_v2` with per-role-group tier thresholds.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| feature_key | TEXT | | NOT NULL | Feature identifier |
| role_group | TEXT | | NOT NULL | Enum: 'mom', 'dad_adult', 'special_adult', 'independent_teen', 'guided_kid', 'play_kid' |
| min_tier | TEXT | 'essential' | NOT NULL | Lowest tier where this role group gets access. Enum: 'essential', 'enhanced', 'full_magic', 'creator', 'never' |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Unique constraint:** `(feature_key, role_group)`

**Seeded during migration with all feature keys set to `min_tier = 'essential'` for mom and `'never'` for all other role groups.** Admin adjusts via Screen 4 during or after beta.

> **Decision rationale:** Replacing `feature_access` with `feature_access_v2` rather than modifying the original table avoids breaking the existing `useCanAccess()` hook during the transition. The hook is updated to query `feature_access_v2` instead. The old table can be dropped after migration.

### New Table: `feature_key_registry`

Master registry of all feature keys across the platform. Populated during the pre-build audit and updated as features are built.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| feature_key | TEXT | | NOT NULL | PK. Unique feature identifier. |
| display_name | TEXT | | NOT NULL | Human-readable name for admin UI |
| description | TEXT | | NULL | Brief description |
| category | TEXT | | NOT NULL | Grouping category for admin screen |
| source_prd | TEXT | | NULL | Which PRD defined this key |
| is_lite_version | BOOLEAN | false | NOT NULL | True for lite variants (Write Drawer, etc.) |
| lite_version_of | TEXT | null | NULL | FK → feature_key_registry. Points to the full version if this is a lite variant. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

### New Table: `member_feature_toggles`

Mom's per-member on/off decisions for features their tier allows.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members |
| feature_key | TEXT | | NOT NULL | FK → feature_key_registry |
| enabled | BOOLEAN | true | NOT NULL | Mom's toggle. Default true (enabled when tier allows). |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Unique constraint:** `(family_id, member_id, feature_key)`

**RLS Policy:** Primary parent can read/write for own family. Members can read own toggles.

> **Decision rationale:** Default `enabled = true` means rows only need to exist when mom explicitly disables a feature for a member. No row = feature is enabled (if tier allows). This keeps the table sparse and avoids needing to create rows for every member × every feature on signup.

### New Table: `ai_credits`

Append-only ledger tracking all credit events.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| amount | INTEGER | | NOT NULL | Positive = credit added. Negative = credit spent. |
| source | TEXT | | NOT NULL | Enum: 'tier_monthly_allotment', 'purchased', 'earned_onboarding', 'earned_promotion', 'tier_sample', 'ai_action_spent', 'expired', 'refund' |
| description | TEXT | | NULL | Human-readable description (e.g., "Monthly allotment - Enhanced", "Milestone: First Guiding Star", "LiLa Optimizer session") |
| feature_key | TEXT | | NULL | Which feature consumed credits (NULL for additions) |
| expires_at | TIMESTAMPTZ | | NULL | NULL = never expires. Set for monthly allotments (end of period) and earned credits (90 days). |
| stripe_payment_id | TEXT | | NULL | Stripe payment intent ID for purchases |
| milestone_id | TEXT | | NULL | Which milestone earned these credits (for onboarding) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Primary parent can read own family's ledger. System role INSERT only (Edge Functions write entries). No user writes.

**Indexes:**
- `(family_id, created_at)` — chronological ledger
- `(family_id, expires_at)` — finding expiring credits
- `(family_id, source)` — filtering by credit type

**Balance calculation:**
```sql
SELECT COALESCE(SUM(amount), 0) as balance
FROM ai_credits
WHERE family_id = $1
AND (expires_at IS NULL OR expires_at > now())
```

### New Table: `credit_packs`

Admin-configurable credit pack definitions.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| name | TEXT | | NOT NULL | Display name (e.g., "Starter", "Bundle", "Power") |
| ai_actions | INTEGER | | NOT NULL | Number of AI actions in this pack |
| price_usd | DECIMAL | | NOT NULL | Price in USD |
| stripe_price_id | TEXT | | NULL | Stripe Price object ID for checkout |
| sort_order | INTEGER | | NOT NULL | Display order |
| is_active | BOOLEAN | true | NOT NULL | Whether this pack is available for purchase |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

### New Table: `tier_sampling_costs`

Admin-configurable per-feature credit costs for tier-sampling.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| feature_key | TEXT | | NOT NULL | PK. FK → feature_key_registry |
| credit_cost | INTEGER | 5 | NOT NULL | AI actions deducted per tier-sample session |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

### New Table: `tier_sample_sessions`

Tracks tier-sampling usage for analytics (which features get sampled most = strongest upgrade signals).

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| user_id | UUID | | NOT NULL | FK → auth.users |
| feature_key | TEXT | | NOT NULL | Which feature was sampled |
| credits_spent | INTEGER | | NOT NULL | How many credits were deducted |
| session_started_at | TIMESTAMPTZ | now() | NOT NULL | |
| session_ended_at | TIMESTAMPTZ | | NULL | When the session ended (feature closed / action completed) |

**RLS Policy:** Service role INSERT/UPDATE only. Admin READ. User READ own family.

### New Table: `onboarding_milestones`

Tracks per-family milestone completion for both earned credits and founding status.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| milestone_key | TEXT | | NOT NULL | Enum: 'account_created', 'family_described', 'first_guiding_star', 'first_entry', 'first_task', 'first_archive_context', 'first_lila_conversation', 'first_best_intention', 'friction_finder', 'first_lifelantern_section' |
| completed_at | TIMESTAMPTZ | | NOT NULL | When this milestone was completed |
| credits_awarded | INTEGER | 0 | NOT NULL | Credits earned (0 for founding families) |

**Unique constraint:** `(family_id, milestone_key)`

**RLS Policy:** Primary parent can read own family. System role INSERT only.

### New Table: `subscription_cancellations`

Captures cancellation feedback for churn analysis.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| tier_at_cancellation | TEXT | | NOT NULL | Which tier they were on |
| reasons | TEXT[] | '{}' | NOT NULL | Multi-select cancellation reasons |
| freeform_feedback | TEXT | | NULL | Optional text feedback |
| was_founding_family | BOOLEAN | false | NOT NULL | Whether they had founding status |
| cancelled_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Service role INSERT only. Admin READ only.

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| PRD-01: Account creation trigger | Auto-creates `family_subscriptions` record on default tier (free/beta). Seeds `onboarding_milestones` row for 'account_created'. |
| PRD-22: Settings overlay | Settings → Subscription & Billing navigates to Screen 1. |
| PRD-02: Permission Hub | Enhanced with tier-awareness (Screen 7). |
| PRD-32: Admin Console | Tier Assignment screen (Screen 4) manages platform-level feature access. |
| Stripe webhooks | All subscription lifecycle events (creation, update, cancellation, payment) flow through the `stripe-webhook-handler` Edge Function. |
| All AI-calling Edge Functions | Each Sonnet-level AI call checks credit balance, deducts credit, and logs to `ai_credits`. |
| PRD-25: Guided Dashboard | Onboarding milestone progress tracked. Milestone completion triggers credit award (or founding milestone tracking). |
| PRD-24: Gamification | Credit-earning milestone completions trigger celebration animations. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| Every feature with `useCanAccess()` | The updated hook queries `feature_access_v2` + `member_feature_toggles` + founding status to determine access. |
| PRD-02: PermissionGate | PermissionGate now incorporates tier-check before role-check. |
| PRD-28B: ESA Invoice | Invoice generator pulls subscription amount from `family_subscriptions` (founding rate if applicable). |
| PRD-10: Widget system | Usage thermometer widget registered as a dashboard widget. |
| PRD-04: Shell Routing | Upgrade prompts render in feature areas where `useCanAccess()` returns false. |
| PRD-05C: Usage tracking | AI usage tracking tables unified with credit system. |

---

## AI Integration

No direct AI integration in this PRD. The credit system meters AI usage from other PRDs but does not make AI calls itself.

The only AI-adjacent logic: milestone completion detection (checking database records when relevant features are used) and credit balance checking (before AI calls in Edge Functions).

---

## Tier Gating

This PRD IS the tier gating system. No `useCanAccess()` feature keys are introduced for the subscription management screens themselves — subscription management is always accessible to the primary parent regardless of tier.

The admin screens (Screen 4) are gated by `staff_permissions` (PRD-32 admin access), not by subscription tier.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Annual billing (yearly pricing, discount calculation) | Stripe yearly price integration, ESA lump-sum support | Future enhancement — admin toggle when ready |
| Referral credit program (earn credits by referring families) | `ai_credits` ledger with `source = 'referral'` | Future marketing/growth PRD |
| Team/Organization tier (school, co-op, charter school group pricing) | Multi-family subscription management | Future institutional PRD |
| Free read-only mode (post-cancellation limited access) | Read-only shell rendering, feature blocking | Future enhancement — define exact read-only behavior |
| PayPal/Venmo activation in Stripe | Stripe Dashboard configuration | Pre-launch checklist item |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| `subscription_tiers` seed data | PRD-01 | Real tier names, prices, founding discounts, AI allotments defined. |
| `feature_access` seed data | PRD-01 | Replaced by `feature_access_v2` with 6 role groups and per-role tier thresholds. |
| `useCanAccess()` switching from "all true" to real gating | PRD-02 | Hook updated to query `feature_access_v2` + `member_feature_toggles` + founding status. |
| Subscription & Billing screen (Settings Screen 10) | PRD-22 | Fully designed: plan comparison, payment management, usage thermometer, credit purchase, founding status, cancellation flow. |
| Per-family AI credit/usage limits | PRD-32 | `ai_credits` table defined. Monthly allotments, credit packs, spending/earning rules, thermometer widget. |
| Earned AI credits onboarding model | Concept Capture | 10 milestones, 50 total credits, 90-day expiration, founding family variant. |
| Freebie → onboarding bridge | PRD-29 | Friction Finder milestone (#9) completes onboarding credit AND seeds in-app experience. |
| Credit-earning as gamification event | PRD-24 | Milestone completion triggers celebration animation via existing gamification event system. |
| Vault tools as credit-spendable experiences | PRD-21A | Tier-sampling modal (Screen 6) allows per-use credit spend to try above-tier features. |
| AI credit pack purchasing | PRD-05C | Credit pack purchase flow (Screen 2) with Stripe one-time payment. |
| `ai_credit_balance` on families table | PRD-05C | Replaced by `ai_credits` ledger table. Balance calculated from ledger sum. |
| `ai_usage_tracking` table | PRD-05C | Unified with `ai_usage_log` (PRD-32) and `ai_credits` ledger. Usage tracking and credit deduction are one operation. |
| Pricing page at `/pricing` | PRD-38 | Data source for public pricing page: `subscription_tiers` table feeds pricing cards. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `subscription_tiers` table seeded with 4 tiers (Essential, Enhanced, Full Magic, Creator) with prices, founding discounts, and placeholder AI allotments
- [ ] `family_subscriptions` table updated with Stripe fields, pending_tier_id, past_due_since, cancelled_at
- [ ] `families` table updated with founding_onboarding_complete, founding_onboarding_grace_deadline, founding_family_lost_at
- [ ] `feature_access_v2` table created and seeded with all registered feature keys × 6 role groups (all set to 'essential' for mom, 'never' for others during beta)
- [ ] `feature_key_registry` populated with all feature keys from all 38 PRDs
- [ ] `member_feature_toggles` table created with RLS policies
- [ ] `ai_credits` ledger table created with RLS policies
- [ ] `credit_packs` table seeded with 3 packs
- [ ] `tier_sampling_costs` table seeded with default per-feature costs
- [ ] `tier_sample_sessions` table created
- [ ] `onboarding_milestones` table created and seeded on new account creation
- [ ] `subscription_cancellations` table created
- [ ] `useCanAccess()` hook updated: queries `feature_access_v2` + `member_feature_toggles` + founding status. During beta, founding override and 'essential' for all mom features means everything still returns true.
- [ ] Stripe account configured with products, prices, and webhook endpoint
- [ ] `stripe-webhook-handler` Edge Function handling all 5 webhook events
- [ ] Screen 1 (Plan Comparison) fully rendered with founding status, tier cards, usage thermometer, credit balance, and action buttons
- [ ] Screen 2 (Credit Packs) purchase flow with Stripe Checkout
- [ ] Screen 3 (Cancellation Flow) with 3-step confirmation and feedback capture
- [ ] Screen 4 (Tier Assignment Admin) with 6 role columns, cost/usage data, dot selector, search/filter, save/revert/export
- [ ] Screen 5 (Usage Thermometer Widget) registered in PRD-10 widget system
- [ ] Screen 6 (Tier-Sampling Modal) functional with credit deduction and session tracking
- [ ] Screen 7 (Permission Hub Enhancement) tier-aware grid with toggles, lock indicators, and expand-to-detail
- [ ] Upgrade flow: immediate tier change with Stripe proration
- [ ] Downgrade flow: scheduled for end of period with pending tier indicator
- [ ] Founding family counter in admin (X / 100)
- [ ] Founding family two-stage activation: enrollment + milestone completion
- [ ] Founding family 30-day grace period logic
- [ ] Founding family status durability: survives tier changes, 14-day payment grace, lost on cancellation
- [ ] Onboarding milestone detection and completion tracking for all 10 milestones
- [ ] Credit award on milestone completion (non-founding families)
- [ ] Credit spending priority: expiring soonest → monthly allotment → earned → purchased
- [ ] Credit balance checking before Sonnet-level AI calls
- [ ] Soft throttle messaging when approaching monthly allotment limit
- [ ] ESA invoice data pipe: `family_subscriptions` amount accessible to PRD-28B invoice generator
- [ ] RLS policies on all new tables enforce family-scoped access
- [ ] All AI-calling Edge Functions instrumented to check/deduct credits

### MVP When Dependency Is Ready
- [ ] Celebration animation on milestone completion (requires PRD-24 gamification event system)
- [ ] Onboarding milestone progress indicator on Guided Dashboard (requires PRD-25)
- [ ] Friction Finder milestone (#9) trigger (requires PRD-29 BigPlans)
- [ ] Vault tool tier-sampling integration (requires PRD-21A vault tools)
- [ ] Founding family counter on public blog (requires PRD-38 blog)
- [ ] Feature highlight comparison on plan cards (requires `feature_access_v2` to be populated with real tier data post-beta)

### Post-MVP
- [ ] Annual billing option with configurable discount
- [ ] Referral credit program
- [ ] PayPal/Venmo activation in Stripe
- [ ] Free read-only mode after cancellation (exact behavior defined)
- [ ] Team/Organization tier for schools and co-ops
- [ ] Credit gifting between families
- [ ] Automated dunning emails for past_due accounts (beyond the initial notification)
- [ ] Per-family AI cost drill-down in admin (PRD-32 forward note)
- [ ] Subscription analytics dashboard in admin (MRR, churn rate, tier distribution, founding family metrics)

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: `useCanAccess(featureKey, memberId?)` now checks three layers: (1) `feature_access_v2` tier threshold for the member's role group, (2) `member_feature_toggles` for mom's per-member decision, (3) founding family override. During beta, layer 1 is set to 'essential' for all mom features, effectively returning true.
- [ ] Convention: Lite feature versions for younger members (Write Drawer, simplified task views) are registered as separate feature keys in `feature_key_registry` with `is_lite_version = true` and `lite_version_of` pointing to the full version's key.
- [ ] Convention: AI action metering applies ONLY to Sonnet-level operations. Haiku calls, embedding operations, Whisper transcription, and JavaScript-only operations are never metered.
- [ ] Convention: Credit spending priority is always: expiring soonest → monthly allotment → earned → purchased. Implemented in a single SQL query with ORDER BY expires_at ASC NULLS LAST, source priority.
- [ ] Convention: The `ai_credits` table is append-only. Balances are always calculated from the ledger sum, never stored as a denormalized field.
- [ ] Convention: Founding family check: `families.is_founding_family = true` AND `family_subscriptions.status = 'active'` AND `families.founding_onboarding_complete = true` → all features unlocked.
- [ ] Convention: Stripe is the single source of truth for payment status. The `stripe-webhook-handler` Edge Function updates `family_subscriptions` — never update subscription status from client-side code.
- [ ] Convention: Tier-sampling grants single-session access. One conversation, one report, one extraction. Access reverts when the session ends. Track sessions in `tier_sample_sessions` for upgrade conversion analytics.
- [ ] Convention: `member_feature_toggles` uses sparse storage — rows only exist when mom explicitly disables a feature. No row = enabled (when tier allows). Never pre-populate toggles for every member × every feature.
- [ ] Convention: The `feature_key_registry` is the authoritative list of all feature keys. During the pre-build audit, Opus generates this from all PRD Tier Gating sections. New features must register here before they can appear in the admin tier assignment screen.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `feature_access_v2`, `feature_key_registry`, `member_feature_toggles`, `ai_credits`, `credit_packs`, `tier_sampling_costs`, `tier_sample_sessions`, `onboarding_milestones`, `subscription_cancellations`
Tables modified: `subscription_tiers` (added: price_yearly, founding_discount, monthly_ai_allotment, features_summary, sort_order, updated_at), `family_subscriptions` (added: stripe_customer_id, stripe_subscription_id, pending_tier_id, cancelled_at, past_due_since), `families` (added: founding_onboarding_complete, founding_onboarding_grace_deadline, founding_family_lost_at)
Tables replaced: `feature_access` → `feature_access_v2` (single boolean replaced by per-role-group tier thresholds)
Tables superseded: `ai_usage_tracking` (PRD-05C) → consolidated into `ai_credits` ledger + `ai_usage_log` (PRD-32). The `ai_credit_balance` column proposed in PRD-05C is replaced by the ledger-based calculation.
Enums updated: `family_subscriptions.status` unchanged: 'active', 'cancelled', 'past_due', 'trialing'
New enums: `feature_access_v2.role_group`: 'mom', 'dad_adult', 'special_adult', 'independent_teen', 'guided_kid', 'play_kid'. `feature_access_v2.min_tier`: 'essential', 'enhanced', 'full_magic', 'creator', 'never'. `ai_credits.source`: 'tier_monthly_allotment', 'purchased', 'earned_onboarding', 'earned_promotion', 'tier_sample', 'ai_action_spent', 'expired', 'refund'
Triggers added: `set_updated_at` on `subscription_tiers`, `feature_access_v2`, `member_feature_toggles`, `credit_packs`, `tier_sampling_costs`
Edge Functions: `stripe-webhook-handler` (webhook processing), `credit-balance-check` (called before Sonnet AI calls), `credit-expiration-sweep` (daily cron to expire credits past their expires_at date)

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Monthly billing only at launch. Annual billing is a future stub.** | Reduces complexity. Provides exit route while building product confidence. Annual for ESA families is a high-priority post-launch addition. |
| 2 | **No "2 months free" annual discount designed now.** | Decision deferred to when annual billing is implemented. Beta testers may receive a separate unspecified promotional period. |
| 3 | **Creator tier is a placeholder with Planned Expansion Cards.** | Honest positioning. Creator features (AI branding, business plans, workflow design) will be designed based on real demand validation data. |
| 4 | **100 founding families, growing dollar discount ($2/$3/$4/$5 off).** | 100 creates scarcity and urgency. Growing discount rewards higher tier commitment. Landing at $7.99/$13.99/$20.99/$34.99 — all under psychological barriers. |
| 5 | **Founding status survives tier changes and 14-day payment grace. Lost on explicit cancellation or non-payment past grace.** | Generous and reduces support headaches. A mom whose card expired shouldn't lose her rate. |
| 6 | **Two-stage founding activation with 30-day grace after tiers go live.** | Ensures founding families genuinely set up the platform. Grace period respects busy moms. |
| 7 | **AI credit allotments are admin-configurable placeholder numbers tuned from beta data.** | Designing the infrastructure without guessing the economics. Real usage data informs real limits. |
| 8 | **Comprehensive usage and cost tracking infrastructure to inform tier gating, pivot decisions, and rate structure.** | The admin needs cost-per-feature, usage-per-feature, and per-family patterns to make informed monetization decisions. |
| 9 | **Three credit packs (Starter/Bundle/Power) at $1.99/$4.99/$12.99.** | Simple options covering casual, regular, and power users. Admin-configurable pricing. |
| 10 | **Same currency for all credit types: AI actions.** | One ledger, one balance, one thermometer. Source column distinguishes earned/purchased/allotment. |
| 11 | **Earned credits replace traditional free trial entirely.** | Earned credits model creates stickiness through personalization, not calendar pressure. Offering both would confuse messaging. |
| 12 | **10 onboarding milestones × 5 credits each = 50 total earned AI actions.** | Each milestone builds stickiness. 50 credits = meaningful feature sampling without replacing subscription value. |
| 13 | **Earned credits expire in 90 days. Purchased credits never expire.** | Gentle urgency on earned credits drives conversion. Purchased credits rolling over feels generous and reduces cancellation pressure. |
| 14 | **Tier-sampling via per-use credit spend, not temporary tier upgrades.** | Simpler than time-based trials. Directly connects spending to value. Each sample is an upgrade conversion opportunity. |
| 15 | **All feature key → tier assignments remain TBD until after beta testing.** | Data-driven tier placement. Admin screen designed for easy post-beta configuration. |
| 16 | **Six role groups for admin tier assignment: Mom, Dad/Adults, Special Adults, Independent Teens, Guided Kids, Play Kids.** | Each role group has meaningfully different access patterns. Special Adults are shift-scoped. Guided and Play have different UI versions. |
| 17 | **Lite feature versions registered as separate feature keys.** | Clean tier gating. No "partial access" complexity in the toggle system. |
| 18 | **Layer 2 (mom's per-member toggles) merged into PRD-02's Permission Hub.** | One place for mom to manage "who gets what." No separate surface. |
| 19 | **Admin tier-assignment screen shows AI cost per feature and usage frequency alongside toggles.** | Essential for informed tier-gating decisions. Cost data from `ai_usage_log`, usage data from `platform_usage_log`. |
| 20 | **Stripe Customer Portal for billing mechanics, custom UI for plan comparison and credit purchase.** | Minimizes custom billing code. Keeps the plan selection experience on-brand. |
| 21 | **Upgrades immediate with proration. Downgrades end-of-period.** | Mom wants the feature now (upgrade). She already paid for the month (downgrade). |
| 22 | **Founding families complete milestones but receive no credits.** | They already have full access. Milestones serve the activation requirement, not the credit system. |
| 23 | **`feature_access` replaced by `feature_access_v2` with per-role-group tier thresholds.** | Original single-boolean model insufficient for 6 role groups with different access patterns. |
| 24 | **`ai_credits` is an append-only ledger, not a balance field.** | Ledger approach provides full audit trail, supports multiple credit sources/expirations, and prevents race conditions on balance updates. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Annual billing | Future enhancement. Schema supports it (price_yearly column). Activate when ready via admin. |
| 2 | Creator tier features | Demand validation via Planned Expansion Cards (PRD-32A). Design based on real user input. |
| 3 | Team/Organization pricing | Future institutional PRD. |
| 4 | Free read-only mode after cancellation | Define exact behavior (which features remain viewable, data export, resubscribe UX). |
| 5 | Referral credit program | Future marketing/growth PRD. Ledger supports it (source = 'referral'). |
| 6 | Exact monthly AI allotment numbers per tier | Set during/after beta based on P90 usage data. Admin-configurable. |
| 7 | PayPal/Venmo activation | Stripe Dashboard configuration. Pre-launch checklist. |
| 8 | Dunning email automation for past_due accounts | Post-MVP. Initial notification is MVP; automated sequence is not. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-01 (Auth & Family Setup) | `subscription_tiers` table modified (new columns). `family_subscriptions` table modified (Stripe fields, pending tier, cancellation). `families` table modified (founding onboarding fields). `feature_access` replaced by `feature_access_v2`. | Update schema. Replace `feature_access` migration with `feature_access_v2`. |
| PRD-02 (Permissions) | `useCanAccess()` hook updated to three-layer model. Permission Hub enhanced with tier-awareness and `member_feature_toggles` grid. | Update hook implementation. Add Screen 7 to Permission Hub. |
| PRD-04 (Shell Routing) | Upgrade prompts need to render in feature areas where `useCanAccess()` returns false instead of blank walls. | Add upgrade prompt component to shell's feature-area fallback. |
| PRD-05 (LiLa Core) | LiLa Help handles billing/subscription questions using data from `family_subscriptions` and `subscription_tiers`. | Add subscription FAQ patterns to Help mode. |
| PRD-05C (LiLa Optimizer) | `ai_usage_tracking` table superseded by `ai_credits` ledger + `ai_usage_log`. `ai_credit_balance` column replaced by ledger calculation. Credit balance check before Sonnet calls. | Update schema references. Wire credit checking into optimization pipeline. |
| PRD-10 (Widgets) | Usage Thermometer Widget registered as a new widget type. | Add widget definition to widget template catalog. |
| PRD-21A (AI Vault) | Vault tools support tier-sampling via credit spend. `allowed_tiers` per-item field now references `feature_access_v2` system. | Wire tier-sampling modal into Vault tool launch flow. |
| PRD-22 (Settings) | Screen 10 stub fully replaced by PRD-31 Screen 1 (Plan Comparison). | Replace stub with full implementation. |
| PRD-24 (Gamification) | Onboarding milestone completion is a gamification event triggering celebration animations. | Register milestone completion as a celebration trigger. |
| PRD-25 (Guided Dashboard) | Onboarding milestone progress indicators display on the guided dashboard. Milestones tracked in `onboarding_milestones` table. | Wire milestone progress UI into onboarding flow. |
| PRD-28B (Compliance Reporting) | ESA invoice pulls subscription amount from `family_subscriptions` (founding rate if applicable). | Confirm data pipe from subscription tables to invoice generator. |
| PRD-29 (BigPlans) | Friction Finder completion is onboarding milestone #9. | Wire milestone trigger on friction diagnosis completion. |
| PRD-32 (Admin Console) | New Tier Assignment section added to admin console. Uses `ai_usage_log` and `platform_usage_log` for cost/usage columns. Founding family counter added to System tab. | Add Tier Assignment screen. Add founding counter widget. |
| PRD-32A (Demand Validation) | Creator tier shows Planned Expansion Cards with "what would you hope it includes?" freeform input. | Register Creator-tier expansion features in `feature_expansion_registry`. |
| PRD-38 (Blog) | Founding family counter displayed on public site when window is open. `/pricing` page stub uses `subscription_tiers` data. | Wire counter and pricing data to public routes. |
| Build Order Source of Truth | PRD-31 completed. 9 new tables, 3 modified tables, 1 replaced table. All feature keys registered in `feature_key_registry`. | Move PRD-31 to completed. Update table inventory. |

---

*End of PRD-31*
