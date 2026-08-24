# PRD-40 — Founder Backfill Ceremony (R-9)

> **Status: READY — not yet run.** Authored by the Slice-6 worker (2026-08-24). The SEAT runs
> this with the FOUNDER present — the worker never executes any step. Every seat-executed
> command below is production-touching and covered by the production-touch gate; the founder's
> presence in the seat window IS the approval channel.
>
> **What this ceremony is:** the founder's own under-13 children get real `coppa_consents`
> rows through the REAL consent UI, so the platform's first consent events are hers (PRD
> Decision 17) and the sequencing law's counter reaches zero — unblocking (but NOT executing)
> the attorney-approval stamp.
>
> **The legal basis, recorded per the Slice-6 dispatch:**
> - Template **v1.0.0 is UNAPPROVED** (`lawyer_approved_at` NULL — ARP draft text). The flow
>   runs anyway because Testworth-class **founding families bypass the R-8 dormant block**
>   (Slice-3 deviation 4; the founder is the consenting parent AND the operator — the posture
>   the Attorney Review Package cover memo asks counsel to confirm).
> - Verification is a **real $1 Stripe TEST-mode charge** (the deployed
>   `create-coppa-verification-intent` runs on TEST keys). R-9's "genuinely FTC-method-
>   compliant live-mode charge" happens at the **cohort-2 re-run**: when counsel approves,
>   the founder re-runs the flow end-to-end on live keys as the first production consent,
>   superseding these interim rows (R-9 "later" clause). Interim rows stay as audit history.
> - **This ceremony does NOT stamp `lawyer_approved_at`** (that is the platform enforcement
>   switch — attorney sign-off first, always), does NOT apply migration 100324 (retention
>   crons stay unscheduled), and does NOT touch live Stripe keys.

---

## Preconditions (seat verifies before starting)

1. Slice-6 migration **100330** applied (the admin RPCs + stamp guard exist).
2. HEAD carries Slices 1–6; Edge Functions `create-coppa-verification-intent` +
   `stripe-webhook-handler` deployed (Slice 2 — confirmed live 2026-07-10) with TEST-mode
   Stripe secrets loaded.
3. `VITE_STRIPE_PUBLISHABLE_KEY` present in the founder's frontend env (Vercel env for
   production, or run the ceremony against a local dev server with `.env.local` — seat's
   call; local is fine, the writes land in production Supabase either way).
4. No lawyer-approved template exists (dormancy still holds):
   ```sql
   SELECT version FROM coppa_consent_templates
   WHERE lawyer_approved_at IS NOT NULL AND retired_at IS NULL;  -- expect 0 rows
   ```
5. The founder has ~30–45 minutes; do the whole ceremony in one sitting.
   (If it spans 06:20 UTC, the daily age-transition cron may drop a harmless, deduped
   `coppa_bracket_review` notification during the pre-flip window of Step 3 — ignorable.)

---

## Step 0 (SEAT) — grant the founder `coppa_admin`

```sql
INSERT INTO staff_permissions (user_id, permission_type, granted_by)
SELECT u.id, 'coppa_admin', u.id
FROM auth.users u WHERE u.email = 'tenisewertman@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM staff_permissions sp
  WHERE sp.user_id = u.id AND sp.permission_type = 'coppa_admin'
);
```

**Assert:** the founder opens `/admin/coppa` and sees the real log (not the access card),
with the sequencing banner reading **BLOCKED: N unconsented under-13 member(s)** and her
kids listed as the blockers. That list IS the ceremony's worklist.

---

## Step 1 (FOUNDER + SEAT) — bracket review, per kid

Seat runs the roster query; founder confirms each row out loud (name, birth date, bracket):

```sql
SELECT fm.display_name, fm.date_of_birth, fm.age, fm.coppa_age_bracket,
       f.family_name
FROM family_members fm JOIN families f ON f.id = fm.family_id
WHERE f.family_name = 'OurFamily'            -- the founder's real family
  AND fm.role NOT IN ('family')
  AND fm.is_active
ORDER BY fm.date_of_birth NULLS LAST;
```

For each child: is the bracket right? A kid who has turned 13 since the 2026-07-08 backfill
should already be `13_to_17` (migration 100329's daily job — if it disagrees, fix the
bracket in **Family Members → edit** before proceeding; a 13+ kid needs NO consent and drops
off the worklist). Any bracket the founder corrects here is corrected through the UI, not SQL.

---

## Step 2 (FOUNDER) — keepsake export per under-13 kid, BEFORE anything else

R-12: the 90-day rolling LiLa sweep applies to these kids the moment the retention crons are
ever scheduled — and the Slice-4 incident (2026-08-24) already swept Mosiah's
older-than-90-days LiLa history once. Export now captures everything that remains.

Per under-13 kid: **Settings → Privacy & Consent** … wait — unconsented kids don't appear
there yet (no consent row). **Correction: the export button lives on Screen 8 per consented
child.** So the keepsake exports run **AFTER Step 3's consents land** but **BEFORE migration
100324 (retention crons) is ever applied** — which is the actual deadline that matters.
Order within this ceremony: consent first (Step 3), then export every kid (this step becomes
Step 4a). The offer is recorded here, at the top, so it is never skipped: **no retention
cron is scheduled until the founder has been offered a keepsake export of every under-13
child.**

---

## Step 3 (FOUNDER, real UI) — the consent flow, per kid

Her kids already exist as members, so the consent gate is reached through the **member-edit
bracket path** (the gate fires on a bracket transition TO `under_13` — `FamilyMembers.tsx`).

**Recommended shape (seat pre-flip):** the seat flips all confirmed under-13 kids to
`13_to_17` in one statement, and the founder then edits each kid back to Under 13 through
the UI — one edit per kid, each firing the real gate:

```sql
-- SEAT, one statement, reversible by the ceremony itself:
UPDATE family_members SET coppa_age_bracket = '13_to_17'
WHERE family_id = (SELECT id FROM families WHERE family_name = 'OurFamily')
  AND coppa_age_bracket = 'under_13';
```

(Alternative, zero-SQL shape: the founder does the two-step toggle per kid herself —
edit → pick "13 to 17" → Save → edit → pick "Under 13" → Save. Same result, more taps.)

Then, per kid, in **Family Members → [kid] → edit → Age bracket → Under 13 → Save**:

- **First kid → the FULL flow (Screens 1–6):** 4 scroll-enforced disclosure sections with
  per-section agreement, the parent affirmation, and the **real $1 TEST-mode card charge**
  (test card `4242 4242 4242 4242`, any future expiry/CVC — TEST keys, no real money moves).
  The flow polls for the webhook-written verification row, then commits the consent.
- **Kids 2–N → Screen 7 (acknowledgment):** verification already on file; per-kid review of
  the 4 sections + acknowledgment checkbox. No charge.

**Seat asserts after EACH kid:**

```sql
SELECT c.consented_at, c.consent_version, c.acknowledged_sections,
       fm.display_name, fm.coppa_age_bracket
FROM coppa_consents c JOIN family_members fm ON fm.id = c.child_member_id
WHERE fm.display_name = '<kid>'
  AND c.revoked_at IS NULL AND c.superseded_at IS NULL;
-- expect: 1 row, consent_version='1.0.0', all 5 section keys present,
--         bracket back to under_13
```

**Seat asserts after the FIRST kid (verification):**

```sql
SELECT verification_method, amount_charged_cents, stripe_payment_intent_id, verified_at
FROM parent_verifications pv
JOIN family_members fm ON fm.id = pv.parent_member_id
WHERE fm.family_id = (SELECT id FROM families WHERE family_name = 'OurFamily')
  AND pv.revoked_at IS NULL;
-- expect: 1 row, stripe_charge, 100 cents, a real pi_... id
```

---

## Step 3b (SEAT) — the Testworth E2E family's under-13 fixtures

**Found live by the Slice-6 tour (2026-08-24):** the platform-wide sequencing counter also
counts the Testworth E2E family's own under-13 members (Jordan and Ruthie — permanent test
fixtures, not real children). Consenting only OurFamily's kids can never reach zero. Seed
consent rows for them via service role (the exact `seedConsentFor` shape the enforcement
E2E suite already uses — a fixture verification for Sarah if none is active, then one
consent row per kid, `consent_version='1.0.0'`, all five section keys). Behaviorally inert
under dormancy; honest for a test family. Do NOT flip their brackets — E2E suites model
under-13 scenarios against them.

```sql
-- Adapt ids after Step 1's roster query run for 'The Testworth Family':
-- 1) ensure an active parent_verifications row for Sarah (insert a
--    pi_CEREMONY_-prefixed fixture one if none), then per kid:
-- INSERT INTO coppa_consents (family_id, child_member_id, parent_member_id,
--   verification_id, consent_version, acknowledged_sections)
-- VALUES (<testworth>, <kid>, <sarah>, <verification>, '1.0.0',
--   ARRAY['what_we_collect','how_lila_uses','who_sees_it','your_rights','parent_affirmation']);
```

Note: E2E suites sweep fixture *verifications they created*; a ceremony-seeded verification
with a `pi_CEREMONY_` prefix is outside every suite's sweep patterns and persists. If a
later suite run leaves Sarah's verification revoked-and-replaced, the consents remain valid
(they FK the verification row, which is never deleted).

## Step 4a (FOUNDER) — keepsake exports (deferred Step 2)

Now that every kid appears on **Settings → Privacy & Consent**, tap **[Export]** per kid.
Each builds a ZIP (7-day signed link, 1/kid/week limit). Download and store them wherever
the founder keeps family keepsakes. Seat confirms:

```sql
SELECT fm.display_name, e.requested_at, e.completed_at
FROM parental_data_exports e JOIN family_members fm ON fm.id = e.child_member_id
WHERE e.family_id = (SELECT id FROM families WHERE family_name = 'OurFamily')
ORDER BY e.requested_at DESC;
```

---

## Step 4b (SEAT) — the closing assertions

```sql
-- The sequencing-law counter platform-wide — THE ceremony success criterion:
SELECT COUNT(*) AS unconsented_under_13
FROM family_members fm
WHERE fm.coppa_age_bracket = 'under_13' AND fm.role <> 'family'
  AND fm.is_suspended_for_deletion = false
  AND NOT EXISTS (
    SELECT 1 FROM coppa_consents c
    WHERE c.child_member_id = fm.id AND c.revoked_at IS NULL AND c.superseded_at IS NULL
  );
-- expect: 0
```

Founder refreshes `/admin/coppa`: the banner flips to **"Sequencing law satisfied — template
approval is unblocked"** and her family's Unconsented column reads 0. The stamp button
enables — **nobody touches it.** It waits for attorney sign-off.

---

## Step 5 (SEAT) — record the basis on the template row

```sql
UPDATE coppa_consent_templates
SET notes = COALESCE(notes || E'\n\n', '')
  || '2026-XX-XX FOUNDER BACKFILL (R-9 interim): the founder consented for her own '
  || 'under-13 children through the real flow against THIS unapproved version, under the '
  || 'R-8 founding-family basis (she is the consenting parent and the operator; posture '
  || 'submitted to counsel in the Attorney Review Package 2026-07-05). Verification was a '
  || 'real $1 Stripe TEST-mode charge. On attorney approval she re-runs the flow on live '
  || 'keys as the first production consent (R-9 later clause); these rows remain as audit history.'
WHERE version = '1.0.0';
```

*(Deviation from R-9's literal "seed template `0.9.0-founder-interim`", flagged for the
seat: the built flow consents against the ACTIVE template, and `coppa_consents.consent_version`
FK-references the version actually shown — a parallel 0.9.0 row would either never be
referenced or require code changes. The honest record is v1.0.0-referenced + this notes
entry. If the seat prefers the literal 0.9.0 row as an additional marker, it can be inserted
retired with explanatory notes — cosmetic either way.)*

---

## What remains AFTER the ceremony (the cohort-2 gate list — none of it today)

| Gate | Owner | Action |
|---|---|---|
| Attorney sign-off on v1.0.0 text | Founder + counsel | Then, and only then: `/admin/coppa` → Record attorney approval (the guarded stamp — enforcement activates platform-wide at that moment) |
| Retention crons | Seat + founder | Apply migration 100324 ONLY after the keepsake exports above are confirmed downloaded |
| Live Stripe keys + live-mode founder re-verification | Founder | R-9 "later" clause — first production consent |
| PRD-41 enforcement flip | ✅ DONE 2026-07-10 | Already enforcing |
| Slice-5 STUB_REGISTRY sweeps (SECURITY DEFINER write RPCs; utility-function AI gates) | Next COPPA session | Pre-activation checklist items |
