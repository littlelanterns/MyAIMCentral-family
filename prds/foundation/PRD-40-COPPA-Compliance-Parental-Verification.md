# PRD-40: COPPA Compliance & Parental Verification

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup — `family_members` table, bulk add flow, manual add flow), PRD-02 (Permissions & Access Control — `useCanAccess()` hook pattern, RLS policies on child-scoped tables), PRD-03 (Design System), PRD-13 (Archives — role-asymmetric Privacy Filtered rule), PRD-20 (Safe Harbor — access gating architecture), PRD-22 (Settings — Privacy & Consent screen location), PRD-31 (Subscription Tier System — Stripe integration, webhook handler pattern), PRD-41 (LiLa Runtime Ethics Enforcement — COPPA infrastructure prerequisite, not yet authored)
**Created:** April 16, 2026
**Last Updated:** April 16, 2026

---

## Overview

PRD-40 is the legal ceremony that wraps around MyAIM Family's existing parental-control architecture. The platform was designed from day one around mom as the primary parent managing her family's data — which means compliance with the Children's Online Privacy Protection Act (COPPA) is largely a matter of documenting consent and verifying the consenting parent's identity, rather than restructuring how data flows. This PRD specifies the consent UX, the verification mechanism, the database of record, and the retrofit work needed across PRD-01, PRD-02, and PRD-31 to enforce consent as a precondition for collecting any under-13 child's personal information.

The verification model is **per-parent, not per-child**. Mom verifies once (via a $1 Stripe charge during beta, or via her subscription payment post-beta — both FTC-approved payment-access verification methods). From that moment forward, adding additional under-13 children requires only a lightweight acknowledgment modal confirming she understands the data practices for each new child. Consent records themselves are per-child, because mom is consenting to data collection for a specific child; revocation is also per-child, so mom can remove one child's data without disturbing siblings.

> **Mom experience goal:** Completing COPPA consent should feel like a reassuring moment — "the platform takes my kids' privacy seriously and is showing me exactly what it does and doesn't do with their data" — not like friction or a legal hurdle. Once mom has verified, adding future children should feel almost seamless: she reviews what she's consenting to, taps acknowledge, and continues building her family.

> **Forward note:** All disclosure language in this PRD is marked `[LAWYER REVIEW REQUIRED]`. Structure, data model, verification mechanism, and flow mechanics are committed. Actual consent screen copy must be reviewed and approved by a qualified attorney before the Beta Readiness Gate clears and before any non-founder family uses the platform.

---

## Key Decisions (Previously Established)

These decisions were settled in prior conversations (March 12, 2026 core COPPA conversation; April 15, 2026 beta messaging thread) and are binding inputs to this PRD:

1. **Verification is per-parent, not per-child.** One verification event establishes mom as verified for all current and future under-13 children she adds.
2. **Payment serves as COPPA verification.** Stripe payment access is an FTC-approved verification method. During beta, a non-refundable $1 COPPA verification fee is charged. Post-beta, the subscription payment serves double duty.
3. **Database structure:** `parent_verifications` (one row per parent verification event) + `coppa_consents` (one row per child, linked to a parent verification).
4. **Trigger condition:** The consent flow fires only when the save operation adds ≥1 under-13 child AND no active `parent_verifications` exists for mom. All-teen (13+) families skip the flow entirely.
5. **Consent UX is separate from general T&C acceptance.** Distinct screen explaining what's collected, how LiLa uses it, who sees it, parental rights, and how to revoke.
6. **Mom is the sole verifying parent.** Dad, Special Adults, and other family members operate under mom's umbrella consent. They cannot verify on her behalf, and they see no COPPA UI.
7. **Safe Harbor is 13+ only.** Under-13 children cannot use Safe Harbor. The full parent-visibility model applies to all under-13 LiLa interactions — no transparency exemption. This resolves the tension between Safe Harbor's "isolated from parent visibility" design point and COPPA's parental access rights.

---

## User Stories

### Initial Verification
- As a mom, when I add my first under-13 child, I want to understand what data the platform collects about them and how it's used so I can make an informed consent decision.
- As a mom, I want the verification charge to feel reasonable and well-explained so I don't feel nickel-and-dimed.
- As a mom, I want to know that my payment information is handled securely and that the verification charge is a one-time event.

### Adding Additional Children
- As a mom who has already verified, I want to add my other under-13 children without paying again but still acknowledge the data practices for each one so I stay informed.
- As a mom, I want to see a clear record of which children I've consented to and when.

### Reviewing and Revoking Consent
- As a mom, I want to see the exact disclosure I agreed to for each child, so I can remember what I consented to.
- As a mom, I want to revoke consent for a specific child (e.g., when they age out of the platform or I change my mind) without affecting my other children's data.
- As a mom, I want a grace period after revoking so I can change my mind if I tapped by accident.
- As a mom, I want confirmation that my child's data was actually deleted when I revoked consent.

### Teen Transitions
- As a mom, when my under-13 child turns 13, I want their COPPA consent record preserved as an audit trail but no longer actively required for data collection.

---

## Screens

### Screen 1: COPPA Consent Screen — Section 1 of 5 (What We Collect)

**Triggering condition:** Mom is saving a bulk-add or manual-add operation that includes ≥1 family member with `coppa_age_bracket = 'under_13'`, AND no active `parent_verifications` record exists for mom's `family_member_id`. The save operation is interrupted; `family_members` rows have NOT been committed yet.

**What the user sees:**

A full-screen modal (not a drawer — this is consent, it demands attention). Branded header with the AIMfM wordmark. Subdued background — this is a serious moment.

```
┌─────────────────────────────────────────────────────────┐
│  [AIMfM wordmark]                                        │
│                                                          │
│  Protecting [Child Name]'s Privacy                       │
│  Section 1 of 5 — What We Collect                        │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Because [Child Name] is under 13, U.S. federal law      │
│  (COPPA) requires us to tell you exactly what we         │
│  collect about them, get your consent, and verify        │
│  you're their parent or legal guardian.                  │
│                                                          │
│  Here's every type of information MyAIM Family will      │
│  collect about [Child Name]:                             │
│                                                          │
│  • Their name, age bracket, and how they relate to       │
│    your family                                           │
│  • A PIN (hashed — we never store the actual number)     │
│    or visual password, if you set one                    │
│  • An avatar or profile image, if you upload one         │
│  • Tasks you assign them and when they complete them     │
│  • Their entries in features you turn on for them        │
│    (journal, Best Intentions, Guiding Stars, tracker     │
│    data, victories, etc.)                                │
│  • Their LiLa (AI assistant) conversations, if you       │
│    grant them LiLa access                                │
│  • Notes you write about them in Archives                │
│  • Photos they or a caregiver attach to task             │
│    completions, if that option is enabled                │
│                                                          │
│  [LAWYER REVIEW REQUIRED — final enumeration of          │
│   collected data must be confirmed by attorney against   │
│   actual platform behavior at beta launch.]              │
│                                                          │
│  ───────────────────────────────────────────────────     │
│                                                          │
│  [ ] I've read what will be collected about              │
│      [Child Name].                                       │
│                                                          │
│  [← Cancel Family Setup]          [Continue to 2 of 5 →] │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Interactions:**
- Scroll is required — the full list must be visible before the checkbox becomes tappable. This enforces scrolled-past-content (a court-defensible design pattern).
- Checkbox must be checked before `[Continue]` becomes enabled.
- `[Cancel Family Setup]` returns mom to the family setup screen WITHOUT committing any rows and WITHOUT charging. If she was mid-bulk-add, the parsed preview is preserved in component state so she doesn't lose her work.
- `[Continue]` advances to Screen 2.

**Data created/updated:** None yet. All state is held in memory until Screen 5 completes verification.

> **Decision rationale:** Section-level acknowledgment (five checkboxes instead of one) is both FTC best practice and court-defensible. Courts have faulted one-click-accept-everything flows for "manufactured consent." Five small friction points are a small price for strong evidence that mom actually read what she agreed to.

---

### Screen 2: COPPA Consent Screen — Section 2 of 5 (How LiLa Uses This)

**What the user sees:**

Same modal shell, Section 2 heading. Content describes how the platform's AI features (LiLa, Edge Functions calling Anthropic/OpenAI/OpenRouter, embedding services) handle child data.

Key points covered (language to be finalized by lawyer):
- AI processes data to answer mom's questions, generate suggestions, and support her parenting — NOT to train AI models
- Child data is sent to AI providers (Anthropic, OpenAI via OpenRouter) under service agreements with no-training clauses
- Embeddings for search/context are stored in the platform's own database, never shared
- LiLa never asks children for personal information directly — all child data flows through mom's configuration or structured interactions (task completions, tracker check-ins) rather than freeform data collection from the child
- Mom can disable AI features per-child at any time in Settings

Acknowledgment checkbox: "I understand how LiLa and AI features use [Child Name]'s information."

`[← Back]  [Continue to 3 of 5 →]`

**Data created/updated:** None yet.

---

### Screen 3: COPPA Consent Screen — Section 3 of 5 (Who Sees It)

**What the user sees:**

Same modal shell, Section 3 heading. Content describes the access model.

Key points covered (language to be finalized by lawyer):
- Mom (the verifying parent) sees everything about [Child Name]
- Dad, Special Adults, and other family members see only what mom explicitly grants them via the permission system
- We never sell [Child Name]'s data
- We never share [Child Name]'s data with advertisers or marketers
- We never share [Child Name]'s data with third parties except the AI service providers listed in Section 2 and secure cloud infrastructure providers (Supabase, Vercel, Stripe) that process data on our behalf under contract
- Law enforcement access requires valid legal process

Acknowledgment checkbox: "I understand who can see [Child Name]'s information."

`[← Back]  [Continue to 4 of 5 →]`

**Data created/updated:** None yet.

---

### Screen 4: COPPA Consent Screen — Section 4 of 5 (Your Rights)

**What the user sees:**

Same modal shell, Section 4 heading. Content describes parental rights under COPPA.

Key points covered (language to be finalized by lawyer):
- Mom can view everything collected about [Child Name] at any time in the member's detail view
- Mom can export all of [Child Name]'s data in a standard format
- Mom can edit or delete individual records at any time
- Mom can revoke COPPA consent for [Child Name] at any time, which will delete [Child Name]'s data after a 14-day grace period
- Mom can contact Three Little Lanterns LLC directly about any privacy concern via [contact info — to be finalized]

Acknowledgment checkbox: "I understand my rights regarding [Child Name]'s information."

`[← Back]  [Continue to 5 of 5 →]`

**Data created/updated:** None yet.

---

### Screen 5: COPPA Consent Screen — Section 5 of 5 (Verification)

**What the user sees:**

The final screen combines two pieces: the parent-affirmation statement and the $1 verification charge flow.

```
┌─────────────────────────────────────────────────────────┐
│  [AIMfM wordmark]                                        │
│                                                          │
│  Protecting [Child Name]'s Privacy                       │
│  Section 5 of 5 — Verify You're the Parent               │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  [ ] I affirm that I am the parent or legal guardian     │
│      of [Child Name] and every child I add to this       │
│      family, and I consent to the collection and use     │
│      of their information as described in the previous   │
│      sections.                                            │
│                                                          │
│  ───────────────────────────────────────────────────     │
│                                                          │
│  To verify you're an adult (COPPA requires this), we'll  │
│  charge your card $1.00. This is a one-time fee — you    │
│  won't be charged again when adding more children.       │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [ Stripe Elements card input — live Stripe form ]│  │
│  │  Card number / Expiration / CVC / ZIP             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  By tapping Verify & Continue, you authorize a $1.00     │
│  non-refundable verification charge to the card above.   │
│                                                          │
│  [← Back]                   [Verify & Continue →]        │
│                                                          │
│  [LAWYER REVIEW REQUIRED — final language of the         │
│   affirmation statement and the verification             │
│   authorization must be reviewed.]                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Interactions:**
- Affirmation checkbox must be checked AND card details must be entered before `[Verify & Continue]` becomes enabled.
- `[Verify & Continue]` creates a Stripe PaymentIntent for $1.00 USD with metadata `purpose=coppa_verification`, `family_id=<id>`, `parent_member_id=<id>`.
- On success:
  - The Stripe webhook handler receives `payment_intent.succeeded`
  - Creates a `parent_verifications` row
  - Creates `coppa_consents` rows for every under-13 child in the pending save operation, each linked to the new verification
  - Commits the `family_members` rows that were held in memory
  - Transitions mom to the success screen (Screen 6)
- On failure (card declined, network error, etc.):
  - Inserts a `parent_verification_attempts` row with `status='failed'` and the failure reason
  - Shows an inline error: "We couldn't process that verification charge. Please check your card details and try again, or use a different card."
  - Does NOT commit `family_members` rows
  - Mom remains on Screen 5 with her data intact

**Data created/updated:**
- On success: `parent_verifications` (1 row), `coppa_consents` (1 row per under-13 child in the pending save), `family_members` (committed), `parent_verification_attempts` (1 row, status='succeeded')
- On failure: `parent_verification_attempts` (1 row, status='failed')

> **Decision rationale:** The $1 charge happens AFTER all five sections are acknowledged, not before. This prevents charging someone who changes their mind partway through the flow. The Stripe charge is the final commitment step, and it's what commits the `family_members` rows atomically.

---

### Screen 6: Verification Success

**What the user sees:**

A warm confirmation screen:

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ✓ Verified!                                             │
│                                                          │
│  Thank you for taking the time to protect your family's  │
│  privacy. Consent records for the following children    │
│  have been saved:                                        │
│                                                          │
│  • [Child Name 1]                                        │
│  • [Child Name 2]                                        │
│  • [Child Name 3]                                        │
│                                                          │
│  You can review or manage consent anytime in             │
│  Settings → Privacy & Consent.                           │
│                                                          │
│  The $1.00 verification charge will appear on your       │
│  statement as "MYAIM VERIFY."                            │
│                                                          │
│  A copy of this consent record has been emailed to       │
│  [mom's email].                                          │
│                                                          │
│                                                          │
│  [Continue to Family Setup →]                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Interactions:**
- `[Continue to Family Setup →]` returns mom to the family setup flow, picking up where she left off.
- An email is sent to mom's account email with: verification timestamp, children covered, exact disclosure text version acknowledged, and link to Settings → Privacy & Consent. This is both a receipt and a COPPA-required revocation notice.

**Data created/updated:** Email log entry in the platform's existing email log table.

---

### Screen 7: Additional-Child Acknowledgment

**Triggering condition:** Mom is saving a bulk-add or manual-add operation that includes ≥1 under-13 child, AND an active `parent_verifications` record already exists for mom. No new verification charge — this is the lightweight acknowledgment path.

**What the user sees:**

A smaller modal (not full-screen — this is acknowledgment, not initial consent):

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  Adding [Child Name] (under 13)                          │
│                                                          │
│  You verified your parental consent on March 15, 2026.   │
│  Adding [Child Name] means the same data practices       │
│  apply to them.                                          │
│                                                          │
│  [Review what's collected →]                             │
│  [Review how LiLa uses it →]                             │
│  [Review who sees it →]                                  │
│                                                          │
│  ───────────────────────────────────────────────────     │
│                                                          │
│  [ ] I acknowledge and consent to the collection and     │
│      use of [Child Name]'s information as described.     │
│                                                          │
│  [← Cancel]                  [Acknowledge & Continue →]  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Interactions:**
- Each `[Review ... →]` link expands inline to show the same section content from Screens 1–4 (read-only). Mom can re-read any section.
- Checkbox must be checked before `[Acknowledge & Continue]` is enabled.
- `[Acknowledge & Continue]` creates a new `coppa_consents` row linked to the existing `parent_verifications` row, then commits the `family_members` row. No Stripe charge.
- If mom is adding multiple under-13 children in one bulk operation, this modal shows once per child (sequentially) — she acknowledges each child individually, then all rows commit together at the end.

**Data created/updated:**
- `coppa_consents` (1 row per child acknowledged)
- `family_members` (committed after all acknowledgments)

---

### Screen 8: Privacy & Consent (Settings)

**Location:** Settings → Privacy & Consent (mom-only).

**What the user sees:**

A dedicated screen in Settings with mom's verification history and per-child consent management:

```
┌─────────────────────────────────────────────────────────┐
│  ← Privacy & Consent                                     │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Your Parental Verification                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ✓ Verified on March 15, 2026                      │  │
│  │  Method: $1.00 payment via Stripe                  │  │
│  │  [View Receipt]                                     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Children Under 13                                       │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Avatar]  Rosie                                    │  │
│  │  Consent given: March 15, 2026                     │  │
│  │  Status: Active                                     │  │
│  │  [Review what I consented to]                      │  │
│  │  [Revoke consent & delete data]                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Avatar]  Henry                                    │  │
│  │  Consent given: March 15, 2026                     │  │
│  │  Status: Active                                     │  │
│  │  [Review what I consented to]                      │  │
│  │  [Revoke consent & delete data]                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Children Who Aged Out of COPPA (13+)                    │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Avatar]  Finn — turned 13 on January 8, 2026     │  │
│  │  Original consent: August 22, 2025                 │  │
│  │  Status: Superseded (child is now 13+)             │  │
│  │  [View original consent record]                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Interactions:**
- `[View Receipt]` shows the Stripe charge details (date, amount, last 4 of card, receipt email).
- `[Review what I consented to]` opens a read-only view of the exact disclosure text version mom acknowledged, loaded from `coppa_consent_templates` via the `consent_version` field on the consent row. This is the "audit replay" — mom sees precisely what she was shown when she consented.
- `[Revoke consent & delete data]` opens Screen 9 (the revocation flow).
- Aged-out children appear in a separate section with consent records preserved but marked `Superseded`. The record remains accessible for mom's own audit but no longer governs data collection (since the child is now 13+ and COPPA doesn't apply).

**Data read:**
- `parent_verifications` (mom's verification record)
- `coppa_consents` (all consent records for her family)
- `coppa_consent_templates` (for disclosure text replay)
- `family_members` (for child names, avatars, current age bracket)

---

### Screen 9: Revocation Flow

**What the user sees:**

A three-step flow similar to PRD-31's cancellation flow:

**Step 1 — What happens when you revoke:**

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  Revoke Consent for [Child Name]                         │
│                                                          │
│  If you revoke consent for [Child Name]:                 │
│                                                          │
│  • [Child Name]'s profile will be removed from your      │
│    family in 14 days                                     │
│  • All of [Child Name]'s data will be permanently        │
│    deleted: tasks, journal entries, LiLa                 │
│    conversations, Archives notes, photos, and            │
│    everything else listed in your original consent       │
│  • Your consent record will be preserved as an audit     │
│    trail, but marked revoked                             │
│  • This does NOT affect your other children's data       │
│                                                          │
│  You have 14 days to change your mind. After that,       │
│  deletion is permanent and cannot be undone.             │
│                                                          │
│  [← I'd like to keep things as they are]                 │
│  [Continue to Revoke →]                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Step 2 — Confirm:**

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  Are you sure?                                           │
│                                                          │
│  Type [Child Name] to confirm:                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [text input]                                       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Optional — tell us why (helps us improve):              │
│  [ ] My child is aging out                               │
│  [ ] Privacy concerns                                    │
│  [ ] Not using the platform                              │
│  [ ] Other                                               │
│                                                          │
│  [← Back]            [Revoke Consent & Start Deletion →] │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Step 3 — Confirmation:**

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ✓ Consent Revoked                                       │
│                                                          │
│  [Child Name]'s data will be permanently deleted on      │
│  April 30, 2026 (14 days from today).                    │
│                                                          │
│  During this 14-day window:                              │
│  • [Child Name]'s profile is hidden from dashboards      │
│  • No new data is collected about them                   │
│  • You can restore access any time by tapping            │
│    "Undo Revocation" in Settings → Privacy & Consent     │
│                                                          │
│  After April 30, 2026:                                   │
│  • All data is permanently deleted                       │
│  • The consent record remains as an audit trail          │
│                                                          │
│  A confirmation has been emailed to [mom's email].       │
│                                                          │
│  [Done]                                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Interactions (Step 2):**
- Type-to-confirm prevents accidental revocation — mom must actually type the child's name.
- `[Revoke Consent & Start Deletion]` sets `coppa_consents.revoked_at = now()` and `coppa_consents.scheduled_deletion_at = now() + interval '14 days'`. It also sets `family_members.is_suspended_for_deletion = true` (hides from dashboards, blocks all data writes) but does NOT yet delete any data.
- A scheduled job (pg_cron or Supabase Edge Function on schedule) runs daily: for any `coppa_consents` with `scheduled_deletion_at <= now()` and `deletion_completed_at IS NULL`, execute the full deletion cascade (described in Edge Cases below), then set `deletion_completed_at = now()`.
- Email sent to mom: immediate confirmation of revocation, scheduled deletion date, link to "Undo Revocation" in Settings.

**Interactions (Undo):**
- If mom re-enters Settings → Privacy & Consent within the 14-day window, the revoked child's row shows with an `[Undo Revocation]` button instead of the normal controls.
- `[Undo Revocation]` clears `coppa_consents.revoked_at`, `coppa_consents.scheduled_deletion_at`, and `family_members.is_suspended_for_deletion`. Everything returns to normal. An email confirms the undo.

**Data created/updated:**
- `coppa_consents` (revoked_at, scheduled_deletion_at, revocation_reason set)
- `family_members` (is_suspended_for_deletion = true)
- Email log entry

---

### Screen 10: Admin Verification Log

**Location:** Admin Console (PRD-32) → Compliance → COPPA Verification Log (admin-only, NOT visible to mom).

> **Depends on:** PRD-32 (Admin Console) — admin access via `staff_permissions`. If admin console is not yet built when PRD-40 ships, this screen is stubbed with a simple table view at a protected `/admin/coppa` route gated by a `staff_permissions.is_admin = true` check.

**What the admin sees:**

A searchable, filterable table of all COPPA verifications and consent events for compliance auditing.

Columns: Family ID, Parent Name, Verification Date, Method, Stripe Charge ID, # Active Consents, # Revoked Consents, # Superseded Consents, Actions.

Filters: date range, verification method, has-revocations, has-failed-attempts, family search.

Actions: View Full Record (shows all `coppa_consents`, `parent_verification_attempts`, `coppa_consent_templates` version references, revocation history for the family).

**Data read:** `parent_verifications`, `coppa_consents`, `parent_verification_attempts`, `coppa_consent_templates`.

> **Decision rationale:** This is for legal/compliance audit purposes. If the FTC ever requests verification records, we export from this screen. Mom never sees this view — she sees Screen 8, which shows only her family's data.

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full | The only role that can verify, consent, review, and revoke. All COPPA UI is surfaced only to mom. |
| Dad / Additional Adult | None | Operates under mom's umbrella consent. Sees no COPPA UI. If mom has not completed COPPA consent for a child, dad sees no data for that child regardless of his other permissions. |
| Special Adult | None | Same as Dad — operates under mom's umbrella consent. Sees no COPPA UI. Shifts involving an unconsented child's data are blocked at the permission layer. |
| Independent (Teen) | None | Teens (13+) are not covered by COPPA. They have no COPPA UI. Their own data protections are a forward-looking teen privacy concern outside this PRD. |
| Guided / Play | None | The children themselves see no COPPA UI. Consent is a parental decision, not a child decision. |

### Shell Behavior

| Shell | COPPA Behavior |
|-------|---------------|
| Mom | Full COPPA flows in family setup, Settings → Privacy & Consent, and revocation. |
| Dad / Additional Adult | Invisible. No COPPA screens, no Settings entry, no indicators. If dad attempts to write data for an unconsented under-13 child (e.g., a task completion), the write is silently blocked at the RLS layer and surfaces as a gentle "This child's profile is not yet set up" message. |
| Special Adult | Same as Dad. |
| Independent (Teen) | Invisible. |
| Guided / Play | Invisible. Kids never see consent UI. |

### Privacy & Transparency

This PRD IS the transparency mechanism — it's the surface where mom can review exactly what she consented to, when, and for whom. There are no teen transparency considerations here because COPPA doesn't apply to teens. Future teen-privacy PRDs may introduce parallel structures for 13-17 data handling under state laws like California's AADC.

---

## Data Schema

### Table: `parent_verifications`

One row per parent verification event. Immutable audit trail.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| parent_member_id | UUID | | NOT NULL | FK → family_members. Always points to the primary_parent. |
| verification_method | TEXT | | NOT NULL | Enum: `stripe_charge` (only value at launch; future: `id_check`, `knowledge_based`, `subscription_payment`). |
| stripe_payment_intent_id | TEXT | | NULL | The $1 charge identifier. NULL for future non-Stripe methods. |
| stripe_customer_id | TEXT | | NULL | Stripe customer ID for later reconciliation. |
| amount_charged_cents | INTEGER | | NOT NULL | 100 for the $1 charge. Tracked for audit even though it's always the same value at launch. |
| currency | TEXT | 'USD' | NOT NULL | |
| verified_at | TIMESTAMPTZ | now() | NOT NULL | When verification completed. |
| ip_address | TEXT | | NULL | IP captured from the request header at verification time. Audit evidence. |
| user_agent | TEXT | | NULL | User agent string at verification time. Audit evidence. |
| revoked_at | TIMESTAMPTZ | | NULL | If mom ever globally revokes all consents (rare). Individual consent revocations are tracked on `coppa_consents` instead. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger. |

**RLS Policy:** Primary parent can SELECT own rows. No UPDATE or DELETE by anyone — this is an immutable audit trail. Service role (Stripe webhook handler) can INSERT. Admin (staff_permissions) can SELECT across all families for compliance audit.

**Indexes:**
- `(family_id)` — lookup by family
- `(parent_member_id)` — lookup by parent
- Unique constraint on `(parent_member_id) WHERE revoked_at IS NULL` — at most one active verification per parent

---

### Table: `coppa_consents`

One row per child consent event. Linked to a parent verification.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| child_member_id | UUID | | NOT NULL | FK → family_members (the under-13 kid). |
| parent_member_id | UUID | | NOT NULL | FK → family_members (mom — denormalized for queries). |
| verification_id | UUID | | NOT NULL | FK → parent_verifications. |
| consent_version | TEXT | | NOT NULL | Semver of the disclosure language mom acknowledged (e.g., `1.0.0`). FK-style reference to `coppa_consent_templates.version`. |
| acknowledged_sections | TEXT[] | | NOT NULL | Array of section keys acknowledged (e.g., `['what_we_collect', 'how_lila_uses', 'who_sees_it', 'your_rights', 'parent_affirmation']`). Must contain all required sections at the time of the consent_version. |
| consented_at | TIMESTAMPTZ | now() | NOT NULL | When this specific child consent was captured. |
| superseded_at | TIMESTAMPTZ | | NULL | Set when child ages into 13+ bracket. Consent record preserved for audit but no longer governs data collection. |
| revoked_at | TIMESTAMPTZ | | NULL | Set when mom revokes consent for this specific child. |
| scheduled_deletion_at | TIMESTAMPTZ | | NULL | Set on revocation: `revoked_at + interval '14 days'`. |
| deletion_completed_at | TIMESTAMPTZ | | NULL | Set when the scheduled deletion job successfully purges child data. |
| deletion_completion_notes | JSONB | | NULL | Populated by the deletion job with per-table row counts and any warnings (e.g., "Skipped 2 sibling journal entries mentioning [Child Name] — manual cleanup recommended"). Audit evidence of the cascade outcome. |
| revocation_reason | TEXT | | NULL | Mom's optional reason from the revocation flow. |
| ip_address | TEXT | | NULL | IP at consent time. Captured only for the initial verification consent (Screen 5); additional-child acknowledgments reference the parent verification's IP. |
| user_agent | TEXT | | NULL | Same as IP. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger. |

**RLS Policy:**
- Primary parent can SELECT own family's rows.
- Primary parent can UPDATE only specific fields: `revoked_at`, `scheduled_deletion_at`, `revocation_reason` (via the revocation flow). Cannot modify `consented_at`, `consent_version`, `acknowledged_sections`, or any audit fields.
- Service role (scheduled deletion job) can UPDATE `deletion_completed_at`.
- Admin can SELECT across all families.
- No DELETE by anyone — the row is preserved as audit evidence even after deletion is completed.

**Indexes:**
- `(family_id, child_member_id) WHERE revoked_at IS NULL AND superseded_at IS NULL` — fast "is this child's consent active?" check
- `(family_id)` — list all consents for a family
- `(scheduled_deletion_at) WHERE deletion_completed_at IS NULL` — for the scheduled deletion job
- Unique constraint on `(child_member_id) WHERE revoked_at IS NULL AND superseded_at IS NULL` — at most one active consent per child

---

### Table: `coppa_consent_templates`

Versioned disclosure text. Audit replay — lets mom see exactly what she agreed to.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| version | TEXT | | NOT NULL | PK. Semver: `1.0.0`, `1.1.0`, etc. |
| published_at | TIMESTAMPTZ | now() | NOT NULL | When this version went live. |
| retired_at | TIMESTAMPTZ | | NULL | When this version stopped being used for new consents. |
| section_what_we_collect | TEXT | | NOT NULL | Full text of Section 1. |
| section_how_lila_uses | TEXT | | NOT NULL | Full text of Section 2. |
| section_who_sees_it | TEXT | | NOT NULL | Full text of Section 3. |
| section_your_rights | TEXT | | NOT NULL | Full text of Section 4. |
| section_parent_affirmation | TEXT | | NOT NULL | Full text of the Section 5 affirmation statement. |
| lawyer_approved_at | TIMESTAMPTZ | | NULL | When a human lawyer signed off on this version. Must be non-NULL before this version can be referenced by any real user's consent. |
| lawyer_name | TEXT | | NULL | For audit. |
| notes | TEXT | | NULL | Changelog notes (e.g., "1.1.0: updated AI provider list to include new embedding service"). |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** All authenticated users can SELECT (read the text version they consented to). Only admin (staff_permissions) can INSERT or UPDATE. No DELETE — versions are immutable once published.

**Indexes:**
- Primary key on `version` serves as lookup index.

> **Decision rationale:** Storing the full disclosure text by version lets us prove, years later, exactly what language a mom agreed to — even if the current disclosure has changed. This is how regulated industries handle consent audit trails (terms of service versioning in financial services follows the same pattern).

---

### Table: `parent_verification_attempts`

Every verification attempt — successful or failed — for abuse detection and support diagnostics.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| parent_member_id | UUID | | NOT NULL | FK → family_members |
| attempt_type | TEXT | | NOT NULL | Enum: `stripe_charge`. |
| status | TEXT | | NOT NULL | Enum: `succeeded`, `failed_declined`, `failed_network`, `failed_other`. |
| stripe_payment_intent_id | TEXT | | NULL | If a PaymentIntent was created. |
| failure_reason | TEXT | | NULL | Stripe decline code or error message. |
| ip_address | TEXT | | NULL | For abuse detection. |
| user_agent | TEXT | | NULL | |
| verification_id | UUID | | NULL | FK → parent_verifications. Set when `status = 'succeeded'`. |
| attempted_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Primary parent can SELECT own family's rows. Admin can SELECT across all families. Service role can INSERT.

**Indexes:**
- `(family_id, attempted_at DESC)` — family's attempt history
- `(parent_member_id, status, attempted_at DESC)` — "how many failed attempts in last hour?" for rate limiting

> **Decision rationale:** Rate limiting on verification attempts prevents card-testing abuse (hostile actors using the verification endpoint to validate stolen cards). Suggest 5 attempts per parent per hour, 20 per day. Enforced at the application layer.

---

### Column Addition: `family_members`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| coppa_age_bracket | TEXT | 'adult' | NOT NULL | Enum: `under_13`, `13_to_17`, `adult`. Defaults to `adult` for safety (must be explicitly set to `under_13` to trigger consent flow). Set by mom during bulk add (AI inference) or manual add (required radio selector). Distinct from `birthday` (which remains optional) and `dashboard_mode` (which remains readiness-based, per PRD-01). |
| is_suspended_for_deletion | BOOLEAN | false | NOT NULL | Set during the 14-day revocation grace period. Blocks all data writes, hides from dashboards. Cleared if mom undoes revocation. |

---

### Enum/Type Updates

- New enum: `verification_method` — `stripe_charge`, `id_check`, `knowledge_based`, `subscription_payment` (only `stripe_charge` active at launch).
- New enum: `coppa_age_bracket` — `under_13`, `13_to_17`, `adult`.
- New enum: `verification_attempt_status` — `succeeded`, `failed_declined`, `failed_network`, `failed_other`.

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| PRD-01: Bulk add save action | When mom confirms the bulk-add preview, the save action first checks: (a) does any row have `coppa_age_bracket = 'under_13'`? (b) does mom have an active `parent_verifications` record? If (a) is true AND (b) is false → route to Screen 1 (full consent flow). If (a) is true AND (b) is true → route to Screen 7 (acknowledgment flow) for each under-13 child. If (a) is false → skip entirely and commit. |
| PRD-01: Manual add save action | Same branching logic as bulk add, applied to the single member being added. |
| PRD-01: Member edit action (age bracket change) | If mom edits a member to change `coppa_age_bracket` from `adult`/`13_to_17` to `under_13`, treat as an add-under-13 event. Route accordingly. |
| Stripe webhook: `payment_intent.succeeded` | For intents with `metadata.purpose = 'coppa_verification'`: create `parent_verifications` row, create pending `coppa_consents` rows, commit pending `family_members` rows, advance UI to Screen 6. |
| Stripe webhook: `payment_intent.payment_failed` | For intents with `metadata.purpose = 'coppa_verification'`: log `parent_verification_attempts` row with failure reason, surface inline error on Screen 5. |
| Scheduled deletion job (daily) | Queries `coppa_consents` for rows where `scheduled_deletion_at <= now() AND deletion_completed_at IS NULL`. For each, executes the deletion cascade (see Edge Cases). |
| Age-bracket transition trigger | Daily job checks for `family_members` where birthday indicates a crossing into age 13. Prompts mom via notification: "Finn turns 13 today — their COPPA consent is now superseded." Mom can review and confirm; system sets `coppa_consents.superseded_at = now()`. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-02: RLS policies on child-scoped tables | Every RLS policy that allows writes to a child's data (tasks, journal entries, tracker data, archive context, LiLa conversations, etc.) is extended to require an active `coppa_consents` row for the target `child_member_id`. Writes to suspended or revoked children's data are blocked. |
| PRD-02: `useCoppaConsent(childMemberId)` hook | Returns one of: `active`, `revoked`, `superseded`, `missing`, `suspended_for_deletion`. Used by frontend to conditionally render UI and by backend Edge Functions to validate requests. |
| PRD-15: Notifications | Revocation confirmations, 14-day deletion reminders (at 7-day and 1-day marks), and age-transition prompts flow through the existing notification pipeline. |
| PRD-22: Settings | Privacy & Consent appears as a Settings entry for mom. |
| PRD-31: Stripe webhook handler | The existing `stripe-webhook-handler` Edge Function from PRD-31 is extended to handle `payment_intent.succeeded` / `payment_intent.payment_failed` events with `metadata.purpose = 'coppa_verification'`. The COPPA handling is a separate code path from subscription handling. |
| PRD-32: Admin Console | Compliance → COPPA Verification Log section registered. |
| Email pipeline | Verification receipts, revocation confirmations, deletion reminders all dispatched. |

---

## AI Integration

No direct AI integration in this PRD (no guided modes, no Edge Function AI calls owned here). COPPA enforcement affects which AI features are available to which members, but the enforcement itself is a permission-layer check, not an AI call. Edge Functions that make AI calls on behalf of an under-13 child must first verify active COPPA consent via `useCoppaConsent()`; if consent is missing or revoked, the call is blocked.

Behavioral boundaries for how LiLa handles under-13 context (filtering, aggregation exclusion, runtime ethics) are specified in the next section.

---

## Child Data Boundaries in LiLa Context Assembly

COPPA requires that a child's personal information be used only for the purposes the parent consented to. This elevates several behavioral rules from architectural preferences to binding compliance requirements. PRD-40 names them here and assigns ownership to the PRDs that implement them — PRD-40 does not spec the filter or ethics implementation itself.

### Privacy Filtered is mom-only (role-asymmetric)

> **Depends on:** PRD-13 (Archives — Privacy Filtered category). The operating rule is: "Privacy Filtered is always mom-only — no other role should see sensitive context management." This is a role-asymmetric filter, not an author-aware filter.

When any non-mom family member (including an under-13 child using LiLa) triggers context assembly, all items flagged `is_privacy_filtered = true` MUST be excluded from the assembled context bundle. The only role that ever sees Privacy Filtered content in LiLa context is `primary_parent` (mom).

**Why this is a COPPA requirement, not just an architectural preference:** a mom's sensitive notes about her child (medical concerns, behavioral observations, therapist feedback) could harm the child if echoed back to that child through LiLa. COPPA requires reasonable protections on how a child's data is used; leaking parental notes about the child into the child's own LiLa conversation violates that standard.

> **Forward note:** Recon (Phase 0.25) confirmed `is_privacy_filtered` is currently implemented as an unconditional strip rather than a role-asymmetric filter. The fix is owned by a separate phase (not PRD-40). PRD-40 names the rule as a binding COPPA requirement so the fix is non-optional before Beta Readiness Gate.

### Aggregation exclusion — under-13 data is never platform-aggregated

Under-13 child data MUST NOT be included in any platform-wide, cross-family, or anonymized aggregation pipeline. Parental consent under COPPA covers data use for the family's own features and for the AI providers processing that family's data under service agreements — it does NOT cover contribution to platform-wide analytics, book training pipelines, or cross-family insight generation.

Affected pipelines (binding constraint on each):
- **PRD-19 (Family Context & Relationships) — aggregation pipelines.** When aggregating context across families or deriving platform-level insights, under-13 child rows MUST be filtered out at the query level. Single-family aggregation (within one mom's own family) is allowed under her consent.
- **PRD-28B (Compliance & Progress Reporting) — cross-family rollups.** Per-family compliance reports generated for the family's own use (e.g., ESA invoices, homeschool compliance reports) are allowed under parental consent. Cross-family rollups, platform benchmarks, or aggregated reports MUST exclude under-13 data.
- **Platform Intelligence Pipeline (book training, capture channels A–L).** Under-13 child interactions, notes, conversations, and any data tied to an under-13 `family_member_id` MUST be excluded from training data, embedding corpuses, and all platform-intelligence ingestion.

> **Depends on:** The CLAUDE.md convention documenting the exclusion rule is authored in Phase 0.26 (separate session). PRD-40 is the *requirement owner* (names aggregation exclusion as a COPPA compliance requirement); the Phase 0.26 CLAUDE.md convention is the *rule text* that code must satisfy. CI enforcement (grep check for aggregation queries that touch child-data tables without an `under_13` filter) lands with the first aggregation-pipeline PRD build.

**Cross-PRD Impact:** the Cross-PRD Impact table at the end of this PRD flags this as an inherited constraint for PRD-19 and PRD-28B builds and for the Platform Intelligence Pipeline.

### Runtime ethics enforcement (binding prerequisite)

> **Depends on:** PRD-41 (LiLa Runtime Ethics Enforcement — not yet authored). PRD-41 will specify Edge-Function-level enforcement of the five auto-reject categories: force, coercion, manipulation, shame-based control, withholding affection.

Currently these categories are prompt-specified but not enforced at the Edge Function level (a recon finding from Phase 0.25). PRD-40 names PRD-41's runtime ethics enforcement as a **binding prerequisite** for under-13 beta access.

**Why this is a COPPA requirement:** a child asking LiLa "how do I make mom not be mad at me" could be coached into manipulation or shame-based relational patterns if the enforcement is prompt-only and the model drifts. COPPA's reasonable-security standard and FTC guidance on AI-involving-minors both push toward deterministic runtime enforcement when the user is a child, not prompt-dependent behavior. PRD-41 is therefore on the critical path to under-13 beta exposure.

PRD-40 does not duplicate PRD-41's specification. It references PRD-41 as a dependency and requires that PRD-41 ship before any real under-13 user uses LiLa.

---

## Parental Access Rights

COPPA requires that parents can review and delete their child's personal information. PRD-40 specifies both the review mechanism (Settings → Privacy & Consent + Member Detail view, per other PRDs) and the export/deletion mechanisms below.

### Parental Data Export

**Where it lives:** Settings → Privacy & Consent → per-child row → `[Export [Child Name]'s Data]` button (on Screen 8).

**What happens on tap:**
1. System queues a background export job for the child.
2. Job iterates every table in the `child_data_tables` registry and exports all rows where the target is the child, in JSON format, bundled into a single ZIP archive alongside a human-readable `README.md` explaining the structure.
3. Avatar images and any task-completion photos are included as binary files in the archive.
4. Archive is uploaded to a signed, time-limited Supabase Storage URL (expires in 7 days).
5. Mom receives an email with the download link and a friendly note: "Here's everything MyAIM Family has collected about [Child Name]."
6. Completed export logged in a new `parental_data_exports` audit table (columns: `id`, `family_id`, `child_member_id`, `parent_member_id`, `archive_path`, `requested_at`, `completed_at`, `downloaded_at`, `ip_address`).

**Rate limit:** 1 export per child per 7 days (prevents abuse without being user-hostile).

**Format:** JSON for structured data, chosen over CSV because child-data tables have nested structures (JSONB columns, array fields) that CSV flattens poorly. Human-readable `README.md` explains each file's purpose in plain language so a non-technical mom can understand what she's looking at.

### Parental Data Deletion

Already specified in the Revocation Flow (Screen 9) and the Deletion Cascade in Edge Cases. Summary here for completeness:

- Mom revokes consent → 14-day grace period with undo → scheduled deletion job runs the cascade → all child data purged from child-data tables → consent record preserved with `deletion_completed_at` set.
- Partial deletion (e.g., "delete my child's journal entries but keep task history") is NOT supported at launch. It's all-or-nothing per child. Forward note in Deferred.

### Cascade Behavior — Deletion Propagation

When a child's data is deleted via consent revocation, references to the child in OTHER family members' data need resolution. This is the tricky part the recon flagged.

**Rules:**

| Reference Type | Deletion Rule |
|----------------|---------------|
| Child is the row's `family_member_id` or primary scope | Hard delete the row. Examples: the child's `tasks`, `journal_entries`, `lila_conversations`. |
| Row in aggregation / synthesis tables (e.g., `monthly_data_aggregations` member_summaries) | Scrub the child's entries from the JSONB structure, keep the surrounding aggregation intact for siblings. |
| Relationship notes about the child (e.g., mom's Archive notes about the child, relationship mediation records) | Hard delete. These are "about the child" personal information under COPPA. |
| Child appears as a reference in a SIBLING's data (e.g., sibling's journal mentions the child by name) | Preserve. Siblings' journals are the siblings' own data, not the departing child's. Mom can manually edit if she wishes. This is NOT a COPPA scope violation — it's the sibling's own expression. |
| Child appears in mom's LiLa conversations as a topic | Hard delete any `lila_conversations` where the child was the subject person. For conversations mentioning the child incidentally, scrub references or leave to mom's manual cleanup. |
| Mediator synthesis outputs (PRD-19 future) naming the child | Hard delete. These are aggregations OF the child's data. |
| Compliance reports (PRD-28B future) naming the child | Hard delete. Same reason. |
| Shared family records where the child was a participant (family celebrations, family-wide victories) | Scrub the child from the participant list; retain the record for other members. |

> **Decision rationale:** The cascade respects two overlapping rights: mom's right to have her child's data deleted under COPPA, AND siblings' right to their own journals and self-expression. The rule of thumb is: "data about the child" goes, "data authored by siblings that happens to mention the child" stays (with manual edit available to mom).

**Cascade completion verification:** after the deletion job runs, it writes a verification summary to the `coppa_consents` row's `deletion_completion_notes` field (new field added to the schema — updating Data Schema section below), listing row counts deleted per table. Admin can audit.

**Column addition to `coppa_consents`:** `deletion_completion_notes JSONB` NULL — populated by the deletion job with per-table counts and any warnings (e.g., "Skipped 2 sibling journal entries mentioning [Child Name] — manual cleanup recommended"). Included in the Data Schema section's row list.

---

## Retention Policy

COPPA requires that personal information not be retained longer than reasonably necessary. PRD-40 specifies retention limits per child-data table with automated deletion triggers.

### Retention Limits for Under-13 Data

| Table | Retention Policy | Rationale |
|-------|-----------------|-----------|
| `lila_messages` | 90 days rolling, auto-delete via scheduled job | Conversation transcripts are not "records of record" — they're ephemeral interaction artifacts. 90 days gives mom a window to review recent conversations without indefinite accumulation. |
| `lila_conversations` | 90 days rolling (cascades with `lila_messages`) | Same. |
| Task completion metadata (`task_completions`) | Retained for the life of the active consent — no rolling deletion | Task completions feed victory recording, streak tracking, and compliance reports. Retention tied to consent lifecycle. |
| `victories` | Retained for the life of the active consent | Celebratory records mom may want to revisit long-term. |
| Tracker data (all `tracker_*` tables) | Retained for the life of the active consent | Long-term tracking is the feature's purpose. |
| `archive_context_items` where child is subject | Retained for the life of the active consent | Mom's deliberate notes about the child. |
| Task-completion photos (Supabase Storage) | 180 days rolling, auto-delete | Photos carry higher privacy risk than text and are less frequently revisited. Longer than conversations, shorter than structured records. |
| Avatar images | Retained for the life of the active consent | Single image per child; low volume; directly tied to identity. |
| `parent_verifications`, `coppa_consents`, `parent_verification_attempts`, `coppa_consent_templates` | Permanent — audit evidence | Legal records. Never retention-deleted. |
| `parental_data_exports` | 90 days after download | Archive record of what was exported; the archive itself expires in 7 days. |

### Automated Deletion Triggers

Three scheduled jobs (daily):

1. **Rolling retention sweep** — for each table with a rolling retention limit, delete rows older than the limit where the target member is under-13. Log deletions to a new `retention_deletion_log` audit table.
2. **Consent-lifecycle sweep** — already specified; processes `coppa_consents` with `scheduled_deletion_at` past.
3. **Storage cleanup** — for Supabase Storage buckets, delete blobs older than their retention policy where the bucket's manifest row is marked under-13.

### Audit Logging for Deletion Events

New table: `retention_deletion_log`.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| child_member_id | UUID | | NOT NULL | FK → family_members |
| source_table | TEXT | | NOT NULL | Which table the deleted rows came from |
| deletion_trigger | TEXT | | NOT NULL | Enum: `rolling_retention`, `consent_revocation`, `storage_cleanup`, `admin_manual` |
| row_count | INTEGER | | NOT NULL | How many rows were deleted in this job run |
| oldest_deleted_at | TIMESTAMPTZ | | NULL | Oldest `created_at` of deleted rows |
| newest_deleted_at | TIMESTAMPTZ | | NULL | Newest `created_at` of deleted rows |
| job_run_id | UUID | | NOT NULL | Groups rows deleted in the same job run |
| executed_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Admin SELECT only. Service role INSERT.

**Indexes:**
- `(family_id, child_member_id, executed_at DESC)` — per-child deletion history
- `(job_run_id)` — group rows from the same job run

---

## Safe Harbor & Under-13

> **Depends on:** PRD-20 (Safe Harbor) — access gating architecture.

**Decision: Safe Harbor is 13+ only.** Under-13 children cannot access Safe Harbor. The feature is gated on `family_members.coppa_age_bracket IN ('13_to_17', 'adult')`.

**Why this decision:** Safe Harbor's design point is isolation from parent visibility — a protected space for processing emotional content without the conversation immediately surfacing to mom. COPPA gives parents an access right to their under-13 child's personal information. These two design goals are fundamentally incompatible. Rather than weaken Safe Harbor's design or create a half-protected under-13 variant that would confuse users and lawyers alike, PRD-40 locks in the simplest, COPPA-safe answer.

**Enforcement:**
- PRD-20's access-gating tables (orientation, literacy, consent) must include an age-bracket check: `coppa_age_bracket != 'under_13'` is a precondition for Safe Harbor orientation completion.
- PRD-20's frontend entry points for Safe Harbor must not render for members with `coppa_age_bracket = 'under_13'`.
- If a child crosses into `13_to_17` (age-transition trigger), Safe Harbor becomes available through the normal teen onboarding path. No automatic enrollment — the teen must go through orientation and literacy like any other teen.

**What under-13 children have instead:** full parent-visible LiLa conversations with the runtime ethics enforcement from PRD-41. No private processing space. This is the COPPA-default behavior and aligns with the under-13 consent model where mom is always the access authority.

**Cross-PRD Impact:** PRD-20 is added to the Cross-PRD Impact table with the age-bracket gating requirement.

---

## Dependencies & Prerequisites

Several beta-blocking dependencies sit outside PRD-40's scope but must be resolved before real under-13 families can be onboarded. PRD-40 names them here as binding prerequisites — the Beta Readiness Gate exit criteria reference this list.

| Prerequisite | Owner | Status |
|--------------|-------|--------|
| Privacy filter implementation as role-asymmetric (mom-only for Privacy Filtered) | Separate privacy-filter-fix phase (not PRD-40) | Recon-flagged as current beta blocker; fix scheduled ahead of Beta Readiness Gate |
| PRD-41 LiLa Runtime Ethics Enforcement (Edge-Function-level enforcement of auto-reject categories) | PRD-41 (new, standalone — not yet authored) | Authoring session upcoming; build required before under-13 beta |
| RLS-VERIFICATION.md expansion covering all child-data tables | Scheduled Expected Gap work — executed after PRD-40 and PRD-30 tables land, before Beta Readiness Gate | Tracked; no owner conflict |
| Aggregation exclusion CLAUDE.md convention | Phase 0.26 | Rule text authored separately; PRD-40 is the requirement owner |
| Lawyer approval of `coppa_consent_templates` version 1.0.0 text | Founder + external counsel | Blocks `lawyer_approved_at` field being set; no real user can consent until this clears |
| Legal review of privacy policy Children's Privacy section | Founder + external counsel | Separate document; lands alongside consent template approval |

---

## Edge Cases

### Bulk add with a mix of ages
Mom describes her family: "My husband Marcus, our kids Amelia (15), Finn (12), Rosie (9), and baby Henry (2)." AI parses this into four member rows. Three of them (Finn, Rosie, Henry) are `under_13`. Amelia is `13_to_17`. Marcus is `adult`.

On save:
- System detects 3 under-13 children and no active verification
- Routes to full consent flow (Screens 1–5)
- After successful $1 charge: creates 1 `parent_verifications` row, creates 3 `coppa_consents` rows (one each for Finn, Rosie, Henry)
- Commits all 5 `family_members` rows atomically (mom + 4 kids — Amelia and Marcus don't need consents since they're 13+)

### Mom cancels mid-flow
Mom reads through Screens 1–4, then cancels on Screen 5 before entering card details. `family_members` rows are NOT committed. No Stripe charge occurs. She returns to the family setup screen with her bulk-add preview intact.

### Stripe charge succeeds but webhook fails
Stripe charges the card, but the webhook fails to reach our endpoint (network issue, deployment mid-process, etc.). Stripe retries the webhook for up to 3 days per Stripe's retry policy. If the webhook never succeeds, the `parent_verifications` and `coppa_consents` rows are never created, but the customer was charged.

**Mitigation:** A daily reconciliation job queries Stripe for recent `payment_intent.succeeded` events with `metadata.purpose = 'coppa_verification'` and cross-references against `parent_verifications.stripe_payment_intent_id`. Any mismatches are reported to admin for manual intervention. The customer sees a support message: "Your verification charge processed but didn't complete on our end. We've already been notified and will resolve this within 24 hours. You can continue using the app in the meantime."

### Mom's card is declined
`parent_verification_attempts` row created with `status='failed_declined'`. Inline error on Screen 5. Mom can retry with a different card. Rate limit: 5 attempts per hour.

### Mom tries to add an under-13 child after globally revoking verification
Her `parent_verifications.revoked_at` is set. The system treats her as unverified. The full consent flow (Screen 1–5) runs again, including a new $1 charge, creating a new `parent_verifications` row.

### Revocation during an active LiLa conversation
Mom revokes consent for Rosie while Rosie is mid-conversation with LiLa in the Guided shell. The conversation is immediately terminated; any messages already sent are included in the scheduled deletion queue. Rosie's shell shows a gentle "This account is being updated" message and logs out. From mom's side, Rosie's profile is hidden from dashboards.

### Deletion cascade — what gets deleted
When the scheduled deletion job runs for a revoked consent, it must cascade through every table storing data tied to the child. The cascade rules (hard-delete vs. scrub vs. preserve) are specified in the **Parental Access Rights → Cascade Behavior** section above. The canonical list of tables to iterate is the `child_data_tables` registry (a TypeScript constant or DB table kept in sync with the schema).

Canonical list at PRD-40 publication (must be re-verified at each schema change):
- `family_members` row for the child (hard delete)
- `tasks`, `task_completions`, `task_assignments` where the child is assignee or creator
- `journal_entries`, `best_intentions`, `intention_iterations`, `guiding_stars`, `victories` scoped to the child
- `lila_conversations` + `lila_messages` where `member_id = child`
- `archive_context_items` where the child is the subject
- `tracker_*` tables scoped to the child
- Avatar images and task-completion photos in Supabase Storage under the child's UUID path
- `special_adult_assignments` where the child is assigned
- `member_permissions`, `member_feature_toggles` for the child
- Any other child-scoped rows in tables added between PRD-40 publication and deployment

> **Forward note:** The deletion cascade list must be re-verified against the schema at every PRD that adds a new child-scoped table. A `CLAUDE.md` convention (added below) requires every new child-scoped table to be registered in the `child_data_tables` registry the deletion job iterates.

**Preserved:** `coppa_consents` row itself (with `deletion_completed_at` and `deletion_completion_notes` set), `parent_verifications` row, `parent_verification_attempts` rows, `retention_deletion_log` rows. These are audit evidence and are never deleted.

### Orphaned `lila_messages.safety_scanned` column
Phase 0.25 recon surfaced that `lila_messages` has a `safety_scanned` column with no clear ownership or wired behavior. This column was likely created for PRD-30 (Safety Monitoring) but is unused at time of PRD-40 authoring.

> **Forward note:** PRD-40 does not adopt, formalize, or remove this column. PRD-30 (Safety Monitoring) owns safety-scanning infrastructure and is the correct owner for resolving the column's fate (formalize as a safety-audit field, or remove as dead code). PRD-40's compliance requirements do not depend on this column either way. Flagged here so it's not forgotten during PRD-30 build.

### Child ages into 13 during an active consent
The age-transition trigger detects the birthday crossing, notifies mom, and marks `coppa_consents.superseded_at = now()`. The child's data is retained (not deleted). The teen enters whatever teen-privacy regime the platform has established (if any). Data collection continues under general T&C, not under COPPA.

### Mom revokes for a child then changes her mind within 14 days
Within the grace period, Settings → Privacy & Consent shows `[Undo Revocation]`. Tapping it clears `revoked_at`, `scheduled_deletion_at`, and `is_suspended_for_deletion`. The consent row is fully active again. Email confirms.

### Existing consent_version retired while a new consent is mid-flow
If an admin retires a consent template version between Screen 1 and Screen 5 of mom's flow, the in-flight consent still uses the version she was shown. The `acknowledged_sections` and `consent_version` reference the version she actually saw, not the newly-current one. (This is handled by capturing `consent_version` in component state at Screen 1, not querying it at Screen 5.)

### Mom has no card on file and can't verify
She's unable to complete beta signup. A support contact is surfaced: "Having trouble verifying? Contact us at [support email]." Edge case for future — out of scope for launch.

---

## Tier Gating

COPPA compliance is universal — not a tier feature. Every family with under-13 children, on every tier including the default beta tier, must complete verification. No tier gating on the verification flow itself.

The `useCanAccess()` feature keys introduced by this PRD:

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `coppa_consent_review` | Access to Settings → Privacy & Consent (view consent records) | Available at all tiers (legally required) |
| `coppa_consent_revoke` | Ability to revoke consent and delete a child's data | Available at all tiers (legally required) |

Both return `true` during beta and at all future tiers — they are never tier-gated because COPPA rights cannot be paywalled.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Age-transition notification (child turns 13) | PRD-15 notification system | Handled when PRD-15 is built; for now, a daily `console.log` + email to mom. |
| Admin Console → Compliance tab | PRD-32 Admin Console | Handled when PRD-32 is built; for now, a protected `/admin/coppa` route. |
| Multi-parent/custody consent scenarios | Future teen/custody privacy PRD | Out of scope. |
| `subscription_payment` as verification method | Post-beta, when subscription tiers launch | Activated via admin toggle when PRD-31 subscription payments become verification-sufficient. |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Under-13 member creation protections | PRD-01 and PRD-02 (implicitly — never formalized) | PRD-40 formalizes the trigger, consent flow, and RLS enforcement. |

---

## Cross-PRD Impact

This section documents retrofit work needed on previously-specced or previously-built PRDs. Each bullet is an action item for the affected PRD's next revision or build session.

### PRD-01 (Auth & Family Setup) — RETROFIT REQUIRED (code already built)

**Schema changes:**
- Add `coppa_age_bracket` column to `family_members` (enum `under_13`/`13_to_17`/`adult`, default `adult`, NOT NULL)
- Add `is_suspended_for_deletion` column to `family_members` (boolean, default false, NOT NULL)

**Bulk add parsing:**
- The AI parsing prompt must be updated to output `coppa_age_bracket` as a structured field for every parsed member. Heuristic: if parsed age is explicitly < 13, output `under_13`. If parsed age is 13–17, output `13_to_17`. If parsed age is ≥ 18 OR the member is clearly an adult (spouse, parent, grandparent), output `adult`. If age is missing/ambiguous, default to `adult` with a UI prompt: "We weren't sure of [Name]'s age — is this child under 13?"

**Bulk add preview UI:**
- For any member parsed as `under_13`, show a prominent indicator: "Under 13 — COPPA Consent required" with a link "Learn what this means" (opens a mini-modal explaining the upcoming consent flow).
- The preview's member-card editor must include a clear age-bracket radio selector so mom can correct the AI's inference before saving.

**Save action:**
- Before committing `family_members` rows, check: (a) does the batch include any `under_13`? (b) does mom have an active `parent_verifications`? Branch per the trigger logic in this PRD's Flows section.
- The save handler must support "held pending verification" state — in-memory preview rows that are not committed until Screen 5 completes.

**Manual add form:**
- Age bracket becomes a required radio selector (Under 13 / 13–17 / Adult) on the manual add form.
- Same save-action branching as bulk add.

### PRD-02 (Permissions & Access Control) — RETROFIT REQUIRED (code already built)

**New hook:**
- `useCoppaConsent(childMemberId: UUID): 'active' | 'revoked' | 'superseded' | 'missing' | 'suspended_for_deletion'` — queries `coppa_consents` and `family_members.is_suspended_for_deletion` to determine current consent state.

**RLS policy extensions:**
- Every RLS policy that allows writes on child-scoped tables must be extended with a condition: `EXISTS (SELECT 1 FROM coppa_consents WHERE child_member_id = <target_child> AND revoked_at IS NULL AND superseded_at IS NULL)`. For tables where the child is identified by `family_member_id`, the check is straightforward. For tables where the child is an indirect reference (e.g., `archive_context_items` where the child is a subject but not the row's `family_member_id`), additional logic may be needed.
- The list of affected tables is the same as the deletion cascade list in Edge Cases above. Every table must be audited.

**Enforcement layer:**
- `useCoppaConsent()` is also called by every Edge Function that writes child-scoped data. Defense in depth — RLS is the source of truth, but the Edge Function check gives us better error messaging.

**Umbrella consent for dad/Special Adults:**
- PRD-02 must explicitly document: dad and Special Adults acting on behalf of an under-13 child operate under mom's umbrella consent. No additional per-role consent required. But if mom has not completed COPPA for the child, dad/Special Adult writes are blocked the same way as any other writes.

**Teen data (13–17):**
- Forward note in PRD-02: teen privacy is not covered by COPPA. A future teen-privacy PRD should introduce a parallel consent/transparency structure for 13–17, likely driven by state laws (California AADC). Out of scope for PRD-40.

### PRD-31 (Subscription Tier System) — FORWARD REQUIREMENTS (PRD not yet built)

**New Stripe product:**
- Create a Stripe one-time-charge product: "MyAIM COPPA Verification" at $1.00 USD. Statement descriptor: `MYAIM VERIFY`. This is a separate SKU from any subscription product.

**Webhook handler extension:**
- The `stripe-webhook-handler` Edge Function specified in PRD-31 must handle `payment_intent.succeeded` and `payment_intent.payment_failed` events. For events where `metadata.purpose = 'coppa_verification'`, route to the COPPA handler (creates `parent_verifications`, `coppa_consents`, commits held `family_members`, sends email receipt). For events where metadata indicates a subscription charge, use the subscription handler from PRD-31.
- The webhook handler must be idempotent: duplicate events for the same `payment_intent.id` should not create duplicate `parent_verifications` rows.

**Cancellation behavior:**
- Subscription cancellation does NOT revoke COPPA consent. Mom's `parent_verifications` row remains valid. Her `coppa_consents` rows remain active. Her family's data is preserved per PRD-31's "data is never deleted on cancellation" stance. COPPA revocation is a separate explicit action in Settings → Privacy & Consent.

**Post-beta transition:**
- When paid subscription tiers launch, the platform can optionally introduce `verification_method = 'subscription_payment'` as a new allowed value. Moms who have an active paid subscription have verified payment access and don't need a separate $1 charge. This requires admin toggle and is out of scope for launch — launch ships with `stripe_charge` as the only method.

**Founding family compatibility:**
- Founding family status is independent of COPPA verification. A founding family mom must still complete COPPA verification if she has under-13 children — her founding status does not waive the COPPA requirement. The $1 COPPA charge and the founding family tier pricing are separate Stripe charges.

---

## What "Done" Looks Like

### MVP (Must Have)

- [ ] `parent_verifications`, `coppa_consents`, `coppa_consent_templates`, `parent_verification_attempts` tables created with correct columns, defaults, and RLS policies
- [ ] `family_members.coppa_age_bracket` and `family_members.is_suspended_for_deletion` columns added
- [ ] Seed data: initial `coppa_consent_templates` version `1.0.0` inserted with placeholder text, `lawyer_approved_at` NULL — blocks any real user consent until lawyer approves
- [ ] Stripe product "MyAIM COPPA Verification" created with $1.00 price and `MYAIM VERIFY` statement descriptor
- [ ] `stripe-webhook-handler` Edge Function handles `payment_intent.succeeded` and `payment_intent.payment_failed` with `metadata.purpose = 'coppa_verification'`
- [ ] Webhook handler is idempotent (duplicate events don't create duplicate rows)
- [ ] Screens 1–5 fully implemented: full 5-section consent flow with section-level checkboxes, scroll-past enforcement, and Stripe Elements on Screen 5
- [ ] Screen 6: verification success confirmation + email receipt
- [ ] Screen 7: additional-child acknowledgment flow (no charge, `coppa_consents` row per child)
- [ ] Screen 8: Settings → Privacy & Consent with verification history and per-child management
- [ ] Screen 9: revocation flow with type-to-confirm, 14-day grace period, undo capability
- [ ] Screen 10: admin COPPA verification log (stubbed to a protected `/admin/coppa` route until PRD-32 is built)
- [ ] PRD-01 retrofit: `coppa_age_bracket` added to bulk add AI output, manual add form, and member edit form
- [ ] PRD-01 retrofit: save-action branching logic (full flow / acknowledgment flow / skip) wired into bulk add and manual add
- [ ] PRD-01 retrofit: in-memory held-pending-verification state for `family_members` rows during consent flow
- [ ] PRD-02 retrofit: `useCoppaConsent()` hook implemented
- [ ] PRD-02 retrofit: RLS policies on all child-scoped tables extended with active-consent check
- [ ] PRD-02 retrofit: every Edge Function writing child-scoped data calls `useCoppaConsent()` before processing
- [ ] Scheduled deletion job: runs daily, processes rows where `scheduled_deletion_at <= now() AND deletion_completed_at IS NULL`, cascades through every child-scoped table
- [ ] Child-scoped tables registry (`child_data_tables` — can be a TypeScript constant or DB table) used by the deletion job and kept in sync with schema
- [ ] Rate limiting: 5 verification attempts per parent per hour, 20 per day (enforced application-layer)
- [ ] Reconciliation job: daily cross-reference Stripe `payment_intent.succeeded` events against `parent_verifications` — flag mismatches to admin
- [ ] Email pipeline: verification receipt (Screen 6), revocation confirmation (Screen 9 Step 3), 7-day and 1-day deletion reminders, age-transition notification
- [ ] Age-transition daily job: detects birthday crossings into 13, sets `coppa_consents.superseded_at`, notifies mom
- [ ] Cancellation of consent flow (`[Cancel Family Setup]` on any screen) returns mom to family setup with bulk-add preview preserved and no charge
- [ ] RLS verification: `RLS-VERIFICATION.md` expansion covering all child-data tables — executed after PRD-40 and PRD-30 tables land, before Beta Readiness Gate. Every child-scoped table confirmed with the active-consent check.
- [ ] Parental data export: `[Export [Child Name]'s Data]` button on Screen 8 → background export job → JSON bundle + README in signed Supabase Storage URL → email with link. 1 export per child per 7 days rate limit.
- [ ] `parental_data_exports` audit table created.
- [ ] Deletion cascade rules implemented per the Parental Access Rights → Cascade Behavior table (hard-delete / scrub / preserve by reference type). Verification summary written to `coppa_consents.deletion_completion_notes` after each cascade run.
- [ ] Retention policy enforcement: rolling retention sweep job (daily) for `lila_messages` (90 days), `lila_conversations` (90 days), task-completion photos in Storage (180 days). All deletions logged to `retention_deletion_log`.
- [ ] `retention_deletion_log` audit table created.
- [ ] Safe Harbor (PRD-20) gated on `coppa_age_bracket != 'under_13'` — enforced at orientation/literacy table RLS AND at frontend entry points.
- [ ] Privacy Filtered role-asymmetric filter (PRD-13 rule) verified to strip Privacy Filtered items for all non-mom roles during LiLa context assembly. Owned by separate privacy-filter-fix phase, but PRD-40 confirms the fix landed before Beta Readiness Gate.
- [ ] Aggregation exclusion: all existing queries in the codebase that touch child-data tables for cross-family aggregation purposes are audited and confirmed to filter out `coppa_age_bracket = 'under_13'`. At time of PRD-40 build, PRD-19 and PRD-28B aggregation pipelines are not yet built — this check is a no-op initially but establishes the audit habit.
- [ ] PRD-41 LiLa Runtime Ethics Enforcement landed and tested — prerequisite for under-13 beta exposure. NOT owned by PRD-40; referenced as dependency.
- [ ] `[LAWYER REVIEW REQUIRED]` marker on every placeholder disclosure string — no real user can consent until markers are cleared by lawyer approval landing in `coppa_consent_templates.lawyer_approved_at`

### MVP When Dependency Is Ready

- [ ] Admin Console COPPA verification log fully integrated into PRD-32 (requires PRD-32 build)
- [ ] Notifications flowing through PRD-15 pipeline (requires PRD-15 build)
- [ ] `subscription_payment` verification method activated (requires PRD-31 subscription tiers launching)

### Post-MVP

- [ ] Teen privacy (13–17) parallel consent structure for state laws like California AADC
- [ ] Multi-parent / custody scenarios where multiple parents want to share consenting responsibility
- [ ] Non-Stripe verification methods (`id_check`, `knowledge_based`) for moms without a credit card
- [ ] Automated compliance report export for FTC requests
- [ ] Internationalization — COPPA-equivalent regimes in other jurisdictions (GDPR-K, etc.)

---

## CLAUDE.md Additions from This PRD

- [ ] `parent_verifications`, `coppa_consents`, `coppa_consent_templates`, `parent_verification_attempts` table schemas
- [ ] Column addition: `family_members.coppa_age_bracket` (enum) and `family_members.is_suspended_for_deletion` (boolean)
- [ ] Convention: every new child-scoped table MUST be registered in the `child_data_tables` registry, and its RLS policies MUST include the active-consent check, and it MUST be covered by the scheduled deletion cascade. No exceptions — this is a legal requirement.
- [ ] Convention: RLS policies on child-scoped tables require `EXISTS (SELECT 1 FROM coppa_consents WHERE child_member_id = <target> AND revoked_at IS NULL AND superseded_at IS NULL)` for any write
- [ ] Convention: `useCoppaConsent(childMemberId)` must be called by every Edge Function writing child-scoped data before processing — defense in depth with RLS
- [ ] Convention: `coppa_consent_templates` rows are immutable once published (`published_at` set). Retirement is via `retired_at`, not UPDATE. New text = new semver version.
- [ ] Convention: `coppa_consents` rows are preserved even after deletion completion. `deletion_completed_at` is set; the row is never hard-deleted. This is the audit trail.
- [ ] Convention: `parent_verifications` rows are immutable audit trails. No UPDATE or DELETE by anyone, including admin.
- [ ] Convention: Stripe webhooks for COPPA verification are idempotent — duplicate events for the same `payment_intent.id` MUST NOT create duplicate `parent_verifications` rows. Enforced via unique constraint + ON CONFLICT DO NOTHING.
- [ ] Convention: The deletion cascade is NOT reversible. The 14-day grace period is the only window for undo. After `deletion_completed_at` is set, data is gone.
- [ ] Convention: `[LAWYER REVIEW REQUIRED]` markers must be cleared — and `coppa_consent_templates.lawyer_approved_at` must be set by the admin — before any non-founder family uses the platform.
- [ ] Convention: Rate limiting on verification attempts — 5 per parent per hour, 20 per day. Application-layer enforcement via `parent_verification_attempts` table.
- [ ] Convention: Dad and Special Adults never see COPPA UI. They operate under mom's umbrella consent. Their writes on child-scoped data are blocked if mom has not consented for the child.
- [ ] Convention: Teens (13+) are not covered by COPPA. Superseded consent records are preserved for audit but do not govern data collection.
- [ ] Convention: Age-bracket transitions (child turns 13) are detected by a daily job, not by real-time triggers. Mom is notified; consent is marked superseded; data is retained.
- [ ] Convention: Mom is the sole verifying parent. Dad, even if he has his own account, cannot verify on mom's behalf. Single-parent families where dad is the primary parent operate with dad-as-mom (the primary_parent role) — COPPA doesn't care about gender.
- [ ] Convention: Privacy Filtered (per PRD-13) is role-asymmetric — only `primary_parent` sees Privacy Filtered items in LiLa context assembly. All other roles have Privacy Filtered items stripped. This is a COPPA compliance requirement, not just an architectural preference. The filter rule is "exclude unless requester is primary_parent."
- [ ] Convention: Under-13 child data MUST be excluded from all platform-wide, cross-family, or anonymized aggregation. Single-family aggregation within one mom's own family is allowed. Cross-family, platform benchmarks, book training, Platform Intelligence Pipeline ingestion — excluded. The rule's authoritative text lives in the aggregation exclusion convention authored in Phase 0.26. CI grep enforcement lands with first aggregation-pipeline PRD build.
- [ ] Convention: Safe Harbor is 13+ only. `coppa_age_bracket != 'under_13'` is a precondition at the access-gating table layer AND at frontend entry points.
- [ ] Convention: PRD-41 runtime ethics enforcement (Edge-Function-level auto-reject for force, coercion, manipulation, shame-based control, withholding affection) is a COPPA infrastructure prerequisite. Under-13 beta exposure is blocked until PRD-41 ships.
- [ ] Convention: Parental data export format is JSON-bundled with human-readable README. Rate limit: 1 export per child per 7 days. Exports expire in 7 days; export records expire from `parental_data_exports` 90 days after download.
- [ ] Convention: Deletion cascade respects sibling-authored data. "Data about the child" is hard-deleted; "data authored by siblings that happens to mention the child" is preserved. Cascade summary written to `coppa_consents.deletion_completion_notes`.
- [ ] Convention: Retention policy enforcement differs by data type: 90 days for `lila_messages` / `lila_conversations`, 180 days for task-completion photos, indefinite under active consent for structured records (tasks, victories, trackers, archive context). All deletions logged to `retention_deletion_log`.
- [ ] Convention: Orphaned columns on existing tables are owned by the PRD responsible for the table's feature domain. PRD-40 does not adopt, formalize, or remove columns outside its scope even when they surface during recon.

---

## DATABASE_SCHEMA.md Additions from This PRD

**Tables defined:** `parent_verifications`, `coppa_consents`, `coppa_consent_templates`, `parent_verification_attempts`, `parental_data_exports`, `retention_deletion_log`

**Columns added to existing tables:** `family_members.coppa_age_bracket`, `family_members.is_suspended_for_deletion`, `coppa_consents.deletion_completion_notes`

**Enums defined:**
- `verification_method`: `stripe_charge`, `id_check`, `knowledge_based`, `subscription_payment`
- `coppa_age_bracket`: `under_13`, `13_to_17`, `adult`
- `verification_attempt_status`: `succeeded`, `failed_declined`, `failed_network`, `failed_other`

**Triggers added:**
- `family_members_coppa_age_bracket_default` — enforces `coppa_age_bracket = 'adult'` default on insert if not specified
- Reconciliation cron (daily): cross-reference Stripe events against `parent_verifications`
- Deletion cascade cron (daily): process `coppa_consents` where `scheduled_deletion_at <= now() AND deletion_completed_at IS NULL`
- Age-transition cron (daily): detect birthday crossings, set `coppa_consents.superseded_at`, notify mom
- Retention sweep cron (daily): enforce rolling retention limits on `lila_messages`, `lila_conversations`, and task-completion photos for under-13 members
- Storage cleanup cron (daily): delete Supabase Storage blobs past retention for under-13 members

**Indexes:** See each table's Data Schema section above.

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Verification is per-parent, not per-child** | FTC cares about verifying the parent, not each child. One mom verified = mom verified. (Inherited from March 12, 2026 conversation.) |
| 2 | **Payment is the verification method** | FTC-approved method. During beta, a non-refundable $1 Stripe charge. Post-beta, subscription payment can serve double duty. (Inherited from March 12, 2026 conversation; $1 amount confirmed in April 15, 2026 beta messaging thread.) |
| 3 | **Two tables: `parent_verifications` + `coppa_consents`** | Clean separation between the one-time verification event and the per-child consent records. Consent scope is per-child even though verification is per-parent. (Inherited from March 12, 2026 conversation.) |
| 4 | **Trigger fires only when first under-13 child is added** | All-teen families skip the flow entirely. No friction for families that don't need it. (Inherited from March 12, 2026 conversation.) |
| 5 | **Consent UX is separate from general T&C** | Distinct full-screen modal, not a line item in sign-up. FTC best practice and a common court-defensibility concern. (Inherited from March 12, 2026 conversation.) |
| 6 | **Mom is the sole verifying parent** | Dad and Special Adults cannot verify. They operate under mom's umbrella. Matches PRD-01's "mom-only account creation" principle. |
| 7 | **Five-section consent screen with section-level acknowledgment** | Courts have faulted one-click-accept-everything flows. Five checkboxes = court-defensible evidence of informed consent. |
| 8 | **`coppa_age_bracket` as a new required column** | Decoupled from `birthday` (which remains optional per PRD-01) and `dashboard_mode` (which remains readiness-based). Explicit, queryable, doesn't leak age labels into UI. |
| 9 | **$1 beta charge is non-refundable** | Cleaner framing ("verification fee" not "product charge") and simpler code. No refund logic. |
| 10 | **14-day staged deletion with undo** | Matches PRD-31's cancellation-at-end-of-period pattern. Protects mom from accidental revocations. Still COPPA-compliant (rule requires deletion in "reasonable" window). |
| 11 | **Per-child revocation, not all-or-nothing** | Per-parent decision was about verification, not consent scope. Per-child revocation matches the per-child consent model. Mom can revoke one child without affecting siblings. |
| 12 | **Consent records preserved after deletion completion** | `coppa_consents` row stays with `deletion_completed_at` set. This is legal evidence of consent and revocation timing. Never hard-delete. |
| 13 | **Versioned disclosure text in `coppa_consent_templates`** | Audit replay — mom can see exactly what language she agreed to, even years later. Standard pattern for regulated industries. |
| 14 | **Placeholder disclosure text marked `[LAWYER REVIEW REQUIRED]`** | Structure, data model, mechanism committed. Actual language is the lawyer's call and blocks Beta Readiness Gate. |
| 15 | **Rate limiting on verification attempts: 5/hour, 20/day per parent** | Prevents card-testing abuse. Application-layer enforcement via `parent_verification_attempts`. |
| 16 | **Reconciliation job for Stripe-webhook mismatches** | Webhooks can fail without retry landing. Daily cross-reference catches the edge case. |
| 17 | **No retrofit flow for existing users** | Only users today are the founder's own family. PRD-40's deployment doesn't need a "here's what changed" modal for existing users — the founder goes through the normal flow as the first real consent event. |
| 18 | **Age transitions (child turns 13) detected by daily job, not real-time** | Simpler, sufficient. Consent is marked superseded; data is retained; mom is notified. No data deletion on age transition. |
| 19 | **Dad/Special Adults have no COPPA UI** | They operate under mom's umbrella. If mom hasn't consented for a child, their data writes for that child are blocked silently. |
| 20 | **COPPA rights cannot be tier-gated** | `coppa_consent_review` and `coppa_consent_revoke` feature keys return `true` at all tiers. You can't paywall legal rights. |
| 21 | **Privacy Filtered is role-asymmetric (mom-only), per PRD-13** | Current implementation is unconditional strip (Phase 0.25 recon finding). PRD-40 elevates role-asymmetric filtering from architecture preference to COPPA compliance requirement. Implementation owned by separate privacy-filter-fix phase, not duplicated here. |
| 22 | **Under-13 data excluded from all platform-wide aggregation** | Parental consent covers family-internal features and AI providers under service agreements — NOT cross-family analytics, book training, or Platform Intelligence Pipeline ingestion. Binding constraint on PRD-19, PRD-28B, and the Intelligence Pipeline. |
| 23 | **PRD-41 runtime ethics enforcement is a COPPA prerequisite** | Prompt-only ethics enforcement is insufficient when the user is a child. Edge-Function-level deterministic enforcement of the five auto-reject categories must ship before under-13 beta. PRD-40 cites PRD-41 as dependency but does not duplicate its spec. |
| 24 | **Safe Harbor is 13+ only** | Safe Harbor's isolated-from-parent design is incompatible with COPPA's parental access rights. Rather than weaken Safe Harbor or build a half-protected under-13 variant, PRD-40 locks in the simplest COPPA-safe answer: under-13 children have full-parent-visible LiLa only. |
| 25 | **Parental export is JSON-bundled with human-readable README** | CSV flattens nested JSONB poorly; JSON preserves structure. README translates file structure to plain language for non-technical moms. One export per child per 7 days rate limit. |
| 26 | **Deletion cascade respects sibling-authored data** | The rule: "data about the child" gets hard-deleted; "data authored by siblings that happens to mention the child" is preserved (mom can manually edit). Siblings' journals are their own data, not the departing child's. |
| 27 | **Rolling retention: 90 days for LiLa conversations, 180 days for photos, indefinite for structured records under active consent** | Conversations are ephemeral; photos carry higher privacy risk than text; structured records (tasks, victories, trackers) are the features' long-term purpose. Differentiated retention per data type. |
| 28 | **`lila_messages.safety_scanned` orphan column deferred to PRD-30** | Phase 0.25 recon finding. PRD-40 doesn't adopt or remove orphaned columns outside its scope. PRD-30 (Safety Monitoring) is the correct owner. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Teen privacy (13–17) protections under state laws | Future teen-privacy PRD, likely driven by California AADC analysis |
| 2 | Multi-parent / custody scenarios | Future PRD addressing shared custody families where multiple parents want consent authority |
| 3 | Non-Stripe verification methods (`id_check`, `knowledge_based`) | Post-launch; for moms without credit cards |
| 4 | `subscription_payment` as active verification method | Activated when PRD-31 subscription tiers launch post-beta |
| 5 | Automated FTC compliance report export | Post-launch; enabled in Admin Console when needed |
| 6 | Internationalization (GDPR-K and other regimes) | Out of scope for U.S. launch |
| 7 | Admin Console integration (Screen 10) | Handled when PRD-32 is built; stubbed as `/admin/coppa` for now |
| 8 | Notification integration (PRD-15) | Handled when PRD-15 is built; email fallback until then |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-01 (Auth & Family Setup) | `family_members` gains `coppa_age_bracket` and `is_suspended_for_deletion` columns. Bulk add AI parsing outputs age bracket. Manual add form requires age bracket selector. Save-action branching routes under-13 additions through the consent flow before committing rows. | Retrofit the built code during PRD-40 build session — schema migration, AI prompt update, form changes, save-action logic. |
| PRD-02 (Permissions & Access Control) | New `useCoppaConsent()` hook. Every RLS policy on child-scoped tables extended with active-consent check. Every Edge Function writing child-scoped data must call `useCoppaConsent()`. Dad/Special Adult umbrella-consent behavior formalized. | Retrofit the built code during PRD-40 build session — hook implementation, RLS policy migrations for every child-scoped table, Edge Function updates. Also: add forward note about teen privacy being out of scope. |
| PRD-31 (Subscription Tier System) | Stripe product "MyAIM COPPA Verification" added. `stripe-webhook-handler` extended for `metadata.purpose = 'coppa_verification'` events. Cancellation does NOT revoke consent. Founding family status independent of COPPA. | Incorporate into PRD-31's spec before PRD-31 is built — update webhook handler section, add COPPA verification product to Stripe configuration checklist, document cancellation/founding-family interactions. |
| PRD-22 (Settings) | Privacy & Consent entry added to Settings. | Update PRD-22 stub to reference PRD-40 Screen 8. |
| PRD-32 (Admin Console) | Compliance tab with COPPA Verification Log. | Update PRD-32 spec to include Screen 10 from this PRD. |
| PRD-13 (Archives) | Privacy Filtered role-asymmetric rule elevated from architectural preference to COPPA compliance requirement. | Privacy-filter-fix phase (separate from PRD-40) implements the rule. PRD-13 stub references updated to cite COPPA as binding. |
| PRD-19 (Family Context & Relationships) | Aggregation pipelines MUST filter out under-13 child rows at query level. Single-family aggregation within one mom's own family is allowed; cross-family or platform-level aggregation is not. | Inherited constraint for PRD-19 build. Grep check for aggregation queries touching child-data tables without an `under_13` exclusion filter lands with first aggregation-pipeline PRD build. |
| PRD-28B (Compliance & Progress Reporting) | Per-family reports (ESA invoices, homeschool compliance) allowed under parental consent. Cross-family rollups and platform benchmarks MUST exclude under-13 data. | Inherited constraint for PRD-28B build. |
| PRD-20 (Safe Harbor) | Safe Harbor is 13+ only. Access-gating tables (orientation, literacy, consent) must include `coppa_age_bracket != 'under_13'` as precondition. Frontend entry points must not render for under-13 members. | Retrofit PRD-20 spec to include the age-bracket gate. Age-transition trigger provides the path into Safe Harbor when a child crosses to 13. |
| PRD-41 (LiLa Runtime Ethics Enforcement — not yet authored) | PRD-41 is a binding COPPA prerequisite. PRD-40 does not duplicate its spec but names it as a dependency for under-13 beta. | Author PRD-41 in a separate session; ensure its build lands before under-13 beta exposure. |
| Platform Intelligence Pipeline (book training, capture channels A–L) | Under-13 child interactions excluded from training data, embedding corpuses, and all platform-intelligence ingestion. | Inherited constraint for any Intelligence Pipeline PRD. |
| RLS-VERIFICATION.md | Every child-scoped table must be verified against the new active-consent requirement. Expansion scheduled after PRD-40 and PRD-30 tables land, before Beta Readiness Gate. | Scheduled Expected Gap work; tracked separately. |
| CLAUDE.md | 22 new conventions added (see CLAUDE.md Additions section). Most significant: the `child_data_tables` registry convention that governs every future PRD adding child-scoped data. Aggregation exclusion convention authored in Phase 0.26. | Add conventions during PRD-40 build session. Aggregation exclusion convention authored separately in Phase 0.26. |

---

*End of PRD-40*
