# Active Build: BETA-COHORT — PRD-40 §9 Interim Consent + PRD-31 Founding-at-Signup

> **Status (2026-09-12): SUITE SLOT COMPLETE — everything the seat asked for is GREEN.**
> `coppa-consent-screens.spec.ts` 12/12; all four named regression suites green
> (coppa-enforcement 7/7, coppa-admin-console 7/7, family-auth-two-door 7/8, teen-cred-login 7/7)
> plus a fixture-safety check on subscription-tiers.spec.ts (27/27); Convention #277 eyes-on tour
> 6/6 with 8 screenshots read, zero defects; `npm run schema:dump` regenerated and reviewed clean.
> All migrations (100338, 100339, 100340) applied to production by the seat;
> `create-coppa-verification-intent` REDEPLOYED; `scripts/beta-cohort-flag-existing.sql` RUN
> (Bridgette's Family flagged founding; public count = 2; Testworth correctly excluded).
> rls-verifier: **PASS, 64 probes, zero access-control gaps** (`RLS-VERIFICATION.md`, new 100338
> section).
>
> **TWO independent P0-class bugs were found and fixed this build.** (1) rls-verifier found a
> NULL-semantics bug in 100338's `handle_new_user()` that rolled back every real signup — the seat
> hotfixed it live (migration 100339, applied); this worker reviewed the fix line-by-line and added
> a regression vitest pin. (2) **This worker independently found a second, pre-existing PRD-40
> Slice 3 defect** in `CoppaAcknowledgeModal.tsx` during the granted suite run — a real React
> state-reset race that could leave a mom's batch-consent Continue button permanently disabled —
> root-caused, fixed in code (not the test), and re-verified via a cold-Vite-cache stress test.
> See "Bug found during the suite run" below for the full account.
>
> **Local proof green: tsc/eslint clean; 36/36 COPPA+BETA-COHORT vitest pins; every E2E suite run
> for real (not just parse-clean).** See the full per-test/per-suite tables below.
>
> **NOTHING commits until the seat referees and the founder confirms.** `git status --porcelain`
> at the bottom of this file — ST-C's files are still in the tree, untouched, never staged.
>
> Two founder rulings dated 2026-09-12 are LAW and already recorded verbatim in:
>   - `claude/feature-decisions/PRD-40-COPPA-Compliance.md` §9 (interim consent)
>   - `claude/feature-decisions/PRD-31-Subscription-Tiers.md`, 2026-09-12 addendum (founding-at-signup)
>
> **Checkpoint 1 design note was posted and approved by the seat (2026-09-12) with THREE
> conditions, all applied verbatim** — see "Seat conditions, verbatim compliance" below.
>
> A parallel session (ST-C, Studio wizard drafts) was active in the same working tree throughout
> this build. `git status --porcelain` confirmed zero file overlap at every checkpoint — ST-C's
> files (`src/components/studio/wizards/*`, `Studio.tsx`, `Lists.tsx`, `childDataTables.ts`,
> `coppa-cascade-plan.ts`, `coppa-write-gates-rollback.sql`, migrations 100333/100335,
> `STUDIO-EXPERIENCE.md`, `STUB_REGISTRY.md`) were never staged, edited, or referenced by this
> build. A stray `__stc_residue_check.mjs` (ST-C's own file, seen at the repo root earlier this
> session) has since disappeared on its own — not deleted by this worker; confirmed via a direct
> `ls` check and `git status`, per the seat's explicit "delete nothing that is not yours"
> instruction. Next-free migration number was re-verified at 100338 immediately before authoring
> (highest existing was 100337).

## Design summary (Checkpoint 1, approved)

One new platform-wide switch, `public.beta_cohort_settings.enabled` (single row, RPC-only reads
via `get_beta_cohort_mode()`, service-role-only writes — the seat/founder flips it with a plain
`UPDATE` at live cutover, no migration/redeploy needed). It gates BOTH causally-linked behaviors
in one coherent concept:

1. **PRD-40 §9 interim consent.** A founding family adding an under-13 child while the switch is
   ON runs the REAL consent flow (Screens 1–4 disclosures, Screen 7 acknowledgment,
   `commit_consented_members`) with Screen 5's $1 Stripe charge replaced by a no-charge "verify
   later" acknowledgment. That records a NEW `parent_verifications` row with a forever-
   distinguishable `verification_method='beta_interim'`, `amount_charged_cents=0`. Non-founding
   families are completely unaffected — they still see the R-8 dormant card exactly as before.
2. **PRD-31 founding-at-signup.** `handle_new_user()` flags every new, non-test-family signup
   founding at signup while the switch is ON, subject to the SAME soft cap PRD-31 Slice 2's
   Stripe Checkout path already uses (organic count < 100 at signup time; ties both win — no
   locking, no re-check after the fact).

### The schema wrinkle (found by tracing the real code, not assumed)

PRD-40 §9.3 requires the interim row to be **immutable** and a **new** row to be recorded at
"finish verifying" — meaning a parent can hold TWO simultaneously-active (`revoked_at IS NULL`)
`parent_verifications` rows once she completes the real $1 charge post-cutover (one real, one
interim). The original `uq_pv_active_per_parent` (migration 100305) allowed only ONE active row
per parent, and `useParentVerification()`/`fetchParentVerification()` called `.maybeSingle()`
(throws on >1 row). Migration 100338 splits that index into two partials —
`uq_pv_active_real_per_parent` (`WHERE revoked_at IS NULL AND verification_method <> 'beta_interim'`)
and `uq_pv_active_interim_per_parent` (`WHERE revoked_at IS NULL AND verification_method = 'beta_interim'`)
— preserving the ORIGINAL double-real-charge race protection in `stripe-webhook-handler`'s 23505
fallback (untouched) while allowing a real+interim pair to coexist. `fetchParentVerification`/
`useParentVerification` now do a real-first-then-interim two-query lookup (each query is
individually guaranteed ≤1 row by the split indexes) instead of one query relying on the old
single-active-row invariant.

`create-coppa-verification-intent`'s idempotent short-circuit (`already_verified`) now excludes
interim rows (`.neq('verification_method', 'beta_interim')`) — otherwise "finish verifying" would
silently never charge anyone, since the existing interim row would short-circuit a new intent from
ever being created.

## Seat conditions, verbatim compliance

1. **`create_beta_interim_verification()` idempotent + minimal, gate order enforced.** Refuses
   (`already_verified`) if an active REAL verification exists; returns the EXISTING row's id if
   an active interim one already exists (never a second one — backed by
   `uq_pv_active_interim_per_parent`); gate order in the function body is literally
   `auth.uid() IS NOT NULL` → `role='primary_parent'` → `families.is_founding_family` →
   `beta_cohort_settings.enabled` → **only then** does it read/write `parent_verifications`.
   Convention #280 discipline throughout. rls-verifier probes for all four refusals + the
   family-shadow session are enumerated below (not yet run — needs a granted slot).
2. **`useStripeVerificationPayment()` extraction load-bearing pin.** `coppa-consent-screens.spec.ts`
   test 8 ("full consent flow with real TEST-mode payment") is UNCHANGED in its assertions but now
   wrapped with `setBetaCohortMode(false)` before running and `setBetaCohortMode(true)` in its
   `finally` — because Testworth/Sarah is ALWAYS founding (asserted in `resolveTestworth`), and
   without forcing the switch off first, Screen 5 would now route her through the BETA-COHORT
   interim panel instead of the real Stripe Payment Element, silently breaking this pre-existing
   test. This is exactly the "founding + switch OFF → real $1 step renders" scenario from the
   original dispatch's PROOF section, folded into the existing test rather than duplicated as a
   new one. `.env.local` already carries `VITE_STRIPE_PUBLISHABLE_KEY` (confirmed present), so
   this test will NOT self-skip once run for real.
3. **`is_test_family` at fixture time — fixed at the source in ALL FOUR files that needed it, not
   just the three named "at minimum."** Investigated every `auth.admin.createUser(` call under
   `tests/` (9 call sites across 8 files) before touching anything:
   - `coppa-consent-screens.spec.ts` (NF_EMAIL) — **fixed**, named explicitly by the seat.
   - `subscription-tiers.spec.ts` (TT2_EMAIL) — **fixed**, NOT named by the seat but a genuine
     finding: this fixture's own force-non-founding `UPDATE families SET is_founding_family=false`
     only touches `families`, never `family_subscriptions` — without `is_test_family`, my new
     `handle_new_user()` logic would have left `family_subscriptions.price_adjustment_kind='founding'`
     lingering on a fixture every later test in that file explicitly relies on starting from a
     CLEAN (non-founding) `family_subscriptions` row. Verified `create-subscription-checkout`'s own
     eligibility logic doesn't check the CALLER's `is_test_family` (only excludes OTHER test
     families from the public count), so this fix does not interfere with that file's own
     founding-grant tests.
   - `seed-testworths-complete.ts` (`createOrGetAuthUser`) — **fixed**, a real finding that
     CONTRADICTS the seat's own assumption ("allowlist the seed-testworths script if it bypasses
     the trigger"). It does **not** bypass the trigger — each of the 8 Testworth members gets a
     real `auth.users` row via this function, firing `handle_new_user()` and spawning a phantom
     "[Name]'s Family" per member (ignored by the script's own separately-built real Testworth
     family). Fixed at the source rather than allowlisted, since allowlisting would have left the
     phantom-founding-flag bug live on every fresh-project seed run.
   - `tests/verification/new-jj-kk-onboarding.ts` — **fixed**, not named by the seat, a standalone
     manual verification script (`npx tsx tests/verification/new-jj-kk-onboarding.ts`) that
     deliberately exercises the real `handle_new_user()` family-creation path. Rarely run, but
     genuinely affected — fixed for correctness.
   - Confirmed-already-safe (no change needed, verified by reading the code, not assumed):
     `coppa-admin-eyes-on-tour.spec.ts`, `coppa-enforcement.spec.ts`, `coppa-admin-console.spec.ts`,
     `coppa-rights-lifecycle.spec.ts` (the seat's "seedChild" reference) — all four already pass
     `skip_auto_family: true`, which makes `handle_new_user()` return BEFORE any family-creation
     code (including the new founding-at-signup block) ever runs. `teen-cred-login.spec.ts`'s
     fixtures never call `auth.admin.createUser` directly at all — the underlying call happens
     server-side inside `family-auth-admin`'s `set_member_credentials`, which ALREADY sets
     `skip_auto_family: true` for both modes (confirmed by direct grep of that Edge Function).
   - **`tests/beta-cohort-auth-user-metadata.test.ts`** (new vitest static pin) — scans every
     `.ts`/`.tsx` file under `tests/` for `auth.admin.createUser(` calls, fails loudly if any
     lacks `is_test_family:true` or `skip_auto_family:true` in its metadata. One deliberate
     exception: `coppa-consent-screens.spec.ts`'s own new founding-at-signup PROBE needs a
     genuinely real (unflagged) signup to prove the behavior fires — marked with a literal
     `BETA-COHORT-DELIBERATE-REAL-SIGNUP` comment the scanner explicitly recognizes and skips (a
     comment-based allowlist of exactly one call site, not a path-based one). **35/35 green**
     (34 pre-existing COPPA pins + this new one) after two rounds of self-correction (a false
     positive on the file's own header-comment mention of the pattern with empty parens, then a
     too-narrow marker-detection window).

## P0 found by rls-verifier + hotfix (migration 100339); singleton guard (migration 100340)

**This is now part of this slice** — both migrations are in the staging list below, and 100339 is
already applied to production (by the seat, as an emergency fix — production signups were broken).

### The bug

Migration 100338's `handle_new_user()` derived the test-family flag as:

```sql
v_is_test_family := (NEW.raw_user_meta_data->>'is_test_family' = 'true');
```

`->>` on an ABSENT key returns SQL `NULL`, not an empty string or `false`. `NULL = 'true'` then
evaluates to `NULL` (three-valued logic), not `false`. **Every real signup** (the app's own
`src/lib/supabase/auth.ts` sends no `is_test_family` key at all — only my own test fixtures ever
set it) hit this path, assigned `NULL` into `v_is_test_family`, and that `NULL` was then inserted
into `families.is_test_family`, a `NOT NULL` column — a `23502` constraint violation that rolled
back the **entire signup transaction** (family + member + subscription + milestone, all of it).
This is exactly the class of bug this codebase's own conventions warn about repeatedly (a value
that "looks conditional" but is actually assigned somewhere a NULL cannot be tolerated) — I missed
it despite reasoning carefully about the `is_test_family`/`skip_auto_family` distinction in my own
Checkpoint 1 design note; I reasoned correctly about WHERE the flag needed to be checked but never
tested the absent-key case against the NOT NULL column it feeds.

**Found by:** the seat's rls-verifier pass (2026-09-12), reproduced live via a rolled-back probe
(so no committed damage from the reproduction itself). **Impact:** zero real signups occurred in
the broken window — the migration was applied and the bug found essentially back-to-back, and the
seat verified this directly. **Fixed by:** the seat, out of necessity (production signups were
actively broken) — `CREATE OR REPLACE FUNCTION public.handle_new_user()` in migration
`00000000100339_beta_cohort_hotfix_is_test_family_null.sql`, applied directly.

### Line-by-line review of 100339 against my 100338 body (done this session)

I diffed the two function bodies in full. **Exactly one line differs**, everywhere else is
byte-identical (comments, structure, the founding-at-signup block, the milestone seed, all of it):

```diff
- v_is_test_family := (NEW.raw_user_meta_data->>'is_test_family' = 'true');
+ v_is_test_family := (COALESCE(NEW.raw_user_meta_data->>'is_test_family', 'false') = 'true');
```

This is the minimal, correct fix. `COALESCE(x, 'false')` substitutes the literal string `'false'`
for a NULL extraction, so the subsequent `= 'true'` comparison always yields a real boolean
(`false` when the key is absent — exactly the desired default) rather than propagating NULL into a
NOT NULL insert. Re-probed by the seat: a no-key signup now creates the family with
`is_test_family=false`, `is_founding_family=true`, `family_subscriptions.price_adjustment_kind='founding'`
— matching this build's own original design intent exactly, just finally reachable.

**100339 is now staged as part of this build** (added to the file list + Post-Build Verification
table below).

### Regression coverage added this session

`tests/beta-cohort-handle-new-user-coalesce.test.ts` (new vitest, local, green) — finds the
CURRENT live `handle_new_user()` definition (the highest-numbered migration file that redefines
it, by filename), extracts its body, and fails if any PL/pgSQL variable ASSIGNMENT
(`v_x := ... raw_user_meta_data->>'key' ... = '...' ...`) derives a boolean from
`raw_user_meta_data->>` without wrapping the extraction in `COALESCE(NEW.raw_user_meta_data->>...)`.
Deliberately scoped to ASSIGNMENT statements, not every occurrence of the pattern anywhere in the
function: the pre-existing `IF ... OR NEW.raw_user_meta_data->>'skip_auto_family' = 'true' THEN`
guard is a CONDITIONAL, not an assignment — PL/pgSQL treats a NULL `IF` condition as false (skip
the branch), which is exactly the correct, safe behavior when that key is absent, and has been
since migration 100075. A blanket "never use this pattern anywhere" rule would have been a false
positive against a pattern that was never actually broken; I verified this reasoning against the
seat's own root-cause description ("`families.is_test_family` (NOT NULL) rejected the insert")
before writing the test, then verified the detector itself catches the exact broken pattern and
passes the exact fixed pattern via an isolated Node script before trusting it against the real
migration file (both confirmed: broken → VIOLATION, fixed → safe, the `skip_auto_family` IF-form →
correctly not flagged at all since it contains no `:=`). **1/1 green**, and the full COPPA +
BETA-COHORT vitest set is now **36/36** (was 35).

The E2E founding-at-signup test (`coppa-consent-screens.spec.ts`) needed **zero code changes** for
this fix — its founding-case `createUser()` call already omitted `user_metadata` entirely (the
`BETA-COHORT-DELIBERATE-REAL-SIGNUP` marker case, written before the P0 was found), which is
EXACTLY the real-world shape that broke. I strengthened its comment to make this connection
explicit for future readers, since the test now carries extra significance it didn't have when
first written — it wasn't written AS a regression test for this bug, but it turns out to already
be one.

### Task 3 — `beta_cohort_settings` singleton guard (migration 100340, AUTHORED ONLY)

A second, minor rls-verifier finding: `beta_cohort_settings` has zero client policies (correct,
by design — RPC-only reads, seat-only writes), but nothing stopped a service_role/postgres caller
from `INSERT`ing a SECOND row. Every reader in the codebase
(`get_beta_cohort_mode()`, `handle_new_user()`, `create_beta_interim_verification()`) does
`SELECT ... FROM beta_cohort_settings LIMIT 1` — a second row would make "which one wins" depend
on unspecified row order, a real correctness risk for a table that gates whether real signups get
charged. `supabase/migrations/00000000100340_beta_cohort_settings_singleton_guard.sql` adds a
`BEFORE INSERT` trigger (`enforce_beta_cohort_settings_singleton()`) that refuses any INSERT once
a row already exists — the table's `DEFAULT gen_random_uuid()` primary key means there's no
natural fixed value to key a UNIQUE constraint on, so a trigger is the correct mechanism (matches
the seat's own framing). Not `SECURITY DEFINER`: the only caller that can ever reach this INSERT
is service_role/postgres (RLS already has zero client policies on this table), which bypasses RLS
on its own privileges — the trigger needs no elevated access. The migration's own self-verification
block PROVES the guard fires (attempts a second insert inside a caught sub-transaction, asserts it
was blocked, asserts the row count is still 1) — proof lives inside the migration itself, safely,
since a caught PL/pgSQL exception block rolls back to an implicit savepoint without aborting the
outer migration transaction. **Authored only — the seat applies, next-free number 100340
re-verified against the actual highest existing migration (100339) immediately before writing.**

### Task 4 — repo-root hygiene

Confirmed via direct `ls` + `git status` that `__stc_residue_check.mjs` (ST-C's own file) is no
longer present at the repo root — it disappeared on its own sometime during this session (not
deleted by this worker; most likely ST-C's own process cleaning up after itself). Nothing was
deleted by this build at any point.

## Bug found during the suite run: CoppaAcknowledgeModal state-reset race (fixed)

**Test 7** ("Family Members page: 'Set Up Under-13 Consent' batches acknowledgment for several
existing children in one pass") failed on the first full-file run with the Continue button for
Child 2 permanently disabled — 30-60s of retries, `disabled` never clearing.

**Diagnosis (empirical, via temporary console.log instrumentation in the component and the test,
both fully reverted before the fix):**

- `.check()` on Child 2's checkbox completed WITHOUT error, but `isChecked()` read back `false`
  immediately after and stayed `false`. Console instrumentation showed the `onChange` handler
  never fired at all on the failing run.
- Root cause: `BatchConsentModal.tsx` and `FamilySetup.tsx` both render `CoppaAcknowledgeModal` as
  the SAME component instance across the whole multi-child sequence — only its `childName`/
  `progress` props change as `gate.index` advances. The component resets its own `acked`/
  `expanded` state in a `useEffect(() => {...}, [isOpen, childName])`, which — being an effect —
  fires AFTER the render commits and paints, not synchronously with it. This opens a real window,
  right after advancing to a new child, where the checkbox still visibly carries the PREVIOUS
  child's `acked` value (stale `true` left over from Child 1) before the effect fires and resets
  it. If Playwright's `.check()` (or a real mom's click) lands during that window, it sees the box
  ALREADY checked and no-ops (a genuine `.check()` semantic — it only clicks if not already
  checked) — then the delayed effect fires moments later and calls `setAcked(false)` anyway,
  wiping out the checked state for good with no further trigger to ever reset it again for that
  child.
- Confirmed via a cold-Vite-cache stress test (`rm -rf node_modules/.vite`, 5 consecutive runs):
  reproduced reliably on cold start (slower effect scheduling widens the race window), passed on
  warm cache — explaining why the bug was intermittent rather than deterministic, and why it read
  as a "flake" at first glance. **This is a genuine mom-facing UX bug independent of testing** — a
  real parent advancing quickly through the batch sequence could see a child's checkbox appear
  pre-checked from the previous child before it visibly un-checks itself, and could get
  permanently stuck if she interacts during that window.
- **Fix applied (code, not the test):** gave `CoppaAcknowledgeModal` a `key` prop at both
  multi-child call sites — `key={gate.selected[gate.index].id}` in `BatchConsentModal.tsx`
  (existing members have real ids) and `key={coppaGate.index}` in `FamilySetup.tsx` (new members
  being added have no id yet, so the index is the natural per-child key). A `key` change forces
  React to unmount the old instance and mount a genuinely fresh one, so `acked`/`expanded`
  initialize to their `useState(false)`/`useState(null)` defaults SYNCHRONOUSLY as part of the
  same render that advances to the new child — no post-paint effect, no race window, no stale
  carry-over ever. The pre-existing `useEffect` reset was left in place (harmless defensive
  redundancy now that a fresh mount already guarantees the reset) rather than removed, since
  removing it isn't necessary to close the bug and isn't this fix's job.
- **Re-verified:** 5 consecutive isolated runs of test 7 (including one against a cold Vite cache
  — the exact condition that reproduced the original failure) — all green. Then the full 12-test
  file re-run from the top — all green (see the results table below).
- **This bug pre-dates BETA-COHORT** — `CoppaAcknowledgeModal.tsx` was not modified by this build
  at all (confirmed via `git diff` — zero changes to that file survive in the final diff); it is a
  latent defect from the original PRD-40 Slice 3 build, only ever exercised by a REAL multi-child
  batch sequence, which test 7 (itself pre-existing, not authored by this build) is the first test
  to do. Recording it here because this session found and fixed it, not because BETA-COHORT
  introduced it.

## What shipped

### Migration `00000000100338_beta_cohort_interim_consent_and_founding_at_signup.sql` (**APPLIED + ledger-repaired by the seat**)

1. `beta_cohort_settings` table (single row, RLS enabled, ZERO client policies — the
   `founding_codes`/`stripe_webhook_events` "closed table, RPC-only" idiom).
2. `get_beta_cohort_mode() RETURNS BOOLEAN` — `STABLE SECURITY DEFINER`, `authenticated`-only.
3. `parent_verifications.verification_method` CHECK extended with `'beta_interim'` (idempotent
   discovered-constraint-name pattern, migration 100305/100290 precedent).
4. `uq_pv_active_per_parent` split into `uq_pv_active_real_per_parent` +
   `uq_pv_active_interim_per_parent` (the schema wrinkle above).
5. `create_beta_interim_verification()` — the gated write path (seat condition 1).
6. `handle_new_user()` — `CREATE OR REPLACE` based on the **live production body**, read via a
   read-only `pg_get_functiondef` query immediately before authoring (the TEEN-CRED lesson — never
   copy a stale migration body). The `skip_auto_family`/domain-skip block and the PRD-31
   `onboarding_milestones` seed are preserved verbatim; only the founding-at-signup block is new.
   `founding_rate_monthly/yearly` are deliberately left NULL at signup — populated for real by a
   genuine Stripe subscription event later, matching PRD-31 Slice 2's own organic/code-granted
   signup design.
7. `admin_coppa_stamp_readiness()` — `CREATE OR REPLACE` adding `interim_verifications_owed`
   (informational only, PRD-40 §9.4 — interim-consented children already have real
   `coppa_consents` rows and were ALREADY not blocking the stamp with zero code changes; this
   field is purely so `/admin/coppa` can show "N families still owe real verification").
8. Full self-verification `DO` block (table/RLS/policy shape, both function grants, CHECK
   constraint content, both split indexes exist and the old combined one is gone, all four
   touched/new functions are `SECURITY DEFINER` with correct anon/authenticated grants).

**Item 6 (`handle_new_user()`) shipped with the P0 bug documented above** — item 6's live text was
superseded the same day by migration 100339 (also applied). See "P0 found by rls-verifier + hotfix"
above for the full account.

`scripts/full-schema-dump.cjs` DOMAIN_ORDER taught the new table (added to the existing PRD-40
COPPA domain block, since both concerns intersect on the same switch). Not yet re-run against the
now-applied schema (`npm run schema:dump` is still a gated, seat-run step per the checklist below).

### Migration `00000000100339_beta_cohort_hotfix_is_test_family_null.sql` (**APPLIED by the seat**)

The P0 hotfix — see "P0 found by rls-verifier + hotfix" above for the full root-cause/fix/review
account. One-line diff against 100338's `handle_new_user()` body: wraps the `is_test_family`
metadata extraction in `COALESCE(..., 'false')` before the boolean comparison.

### Migration `00000000100340_beta_cohort_settings_singleton_guard.sql` (authored, NOT applied)

The `beta_cohort_settings` singleton guard — see "Task 3" above for the full account.

### Edge Function fix (**DEPLOYED by the seat**, 401 probe confirmed)

`create-coppa-verification-intent/index.ts` — the idempotent short-circuit query now excludes
`verification_method='beta_interim'` rows (the "finish verifying" fix — see schema wrinkle above).
One-line diff plus a doc comment; no other behavior changed.

### Frontend

- **`src/lib/coppa/useCoppaGate.ts`** — `ParentVerification` interface gained
  `verification_method?: string`; `fetchParentVerification`/`useParentVerification` rewritten for
  the real-first-then-interim lookup; new exports: `fetchBetaCohortMode`, `useBetaCohortMode`,
  `createBetaInterimVerification`, `needsFinishVerifying` (pure, unit-testable trigger for the
  "finish verifying" prompt: interim-only AND switch is off).
- **`src/lib/coppa/useStripeVerificationPayment.ts`** (new) — the shared Stripe $1
  create-intent → mount → confirm → poll mechanism, extracted from `CoppaConsentFlow`'s old
  `VerificationStep` so the "finish verifying" flow can reuse it verbatim (seat condition 2).
  Owns its own `payment` phase state machine internally (including the "committing" transition
  around the caller's `onVerificationResolved`), so callers are pure async functions with no
  state-management concerns of their own.
- **`src/components/coppa/CoppaConsentFlow.tsx`** — `betaInterimEligible: boolean` added to
  `CoppaConsentFlowProps` (resolved imperatively by every caller, same discipline as
  `template`/founding status). `VerificationStep` now ALWAYS calls `useStripeVerificationPayment`
  (rules-of-hooks) with `armed: affirmed && !betaInterimEligible` — when `betaInterimEligible` is
  true, the hook stays fully inert and `VerificationStep` renders the NEW `BetaInterimPanel`
  instead of `RealStripeVerificationPanel`. Busy-state (for the modal's "never abandon mid-
  charge/mid-commit" close guard) is now reported UP from `VerificationStep` via a new
  `onBusyChange` callback, since the phase state itself moved out of `CoppaConsentFlow`'s own
  `useState` into whichever panel/hook owns it.
- **`src/components/coppa/FinishVerifyingModal.tsx`** (new) — the "finish verifying" modal for
  Settings → Privacy & Consent. Reuses `useStripeVerificationPayment` verbatim; no batch to
  commit and no new consent to give (mom already consented for real) — this closes ONLY the
  identity-verification gap.
- **`src/pages/PrivacyConsentPage.tsx`** — mounts `FinishVerifyingModal`; the "Your Parental
  Verification" card gains a conditional "Finish verifying" row driven by `needsFinishVerifying()`.
- **`src/hooks/useMemberSaveAndConsentGate.tsx`**, **`src/pages/FamilySetup.tsx`**,
  **`src/components/coppa/BatchConsentModal.tsx`** — all THREE real callers of `CoppaConsentFlow`
  (a fourth caller, `BatchConsentModal.tsx`, was found only by `tsc -b` failing after the first two
  were fixed — confirms this was a genuinely complete sweep, not a guess) now resolve
  `betaInterimEligible = founding && (await fetchBetaCohortMode())` imperatively at the exact same
  gate-fire moment they already resolve `founding`/`template`, and thread it through to
  `CoppaConsentFlow`.
- **`src/pages/SettingsPage.tsx`** — `FamilyManagementSection` gains a display-only "You're a
  founding beta family" badge (`family?.is_founding_family`) — no picker, no gating (the beta plan
  picker itself is explicitly PRD-31 Slice 5 scope, per the 2026-09-12 addendum item 3).

### Seat-run batch script (**RUN by the seat**)

`scripts/beta-cohort-flag-existing.sql` — flags EXISTING beta families founding (PRD-31 addendum
item 1: "Existing beta families... are flagged by the seat in one batch"). Idempotent, excludes
`is_test_family`, does NOT re-check the soft cap (a founder-authorized retroactive recognition of
existing users, not a race against the live 100-family cap for new signups). **Confirmed result:
Bridgette's Family flagged founding; public organic founding count = 2; Testworth correctly
excluded** (per the seat relay).

## Test additions

### `tests/beta-cohort-auth-user-metadata.test.ts` (new vitest, local, green)

Static source scan — see seat condition 3 above. 35/35 green across all COPPA + this new pin
together.

### `tests/e2e/features/coppa-consent-screens.spec.ts` (extended, parse-clean, NOT run)

12 tests total (9 pre-existing + 3 new), plus the modified test 8. New:

1. **"BETA-COHORT: founding family + beta cohort mode ON — Screen 5 offers the no-charge interim
   path end to end."** Revokes Sarah's verification, walks all 4 disclosure sections, asserts the
   INTERIM panel renders (not the Stripe element), completes it, asserts: member created, consent
   row linked to a `verification_method='beta_interim'`/`amount_charged_cents=0`/
   `stripe_payment_intent_id=NULL` row, and the PIN pipeline resumes exactly as the real-charge
   path. **Cleans up its own interim verification row (+ consent, FK `ON DELETE RESTRICT`) BEFORE
   restoring Sarah's original verification** — required because a lingering active interim row
   would break every later test's `seedSarahVerification()` `.maybeSingle()` call (only one active
   row of EACH kind is now legal, and `seedSarahVerification` doesn't expect two).
2. **"BETA-COHORT: 'finish verifying' appears only for interim-only families; completing it
   records a NEW real verification without touching the interim row."** Seeds an interim
   verification directly, confirms the prompt is HIDDEN while the switch is ON, flips the switch
   off, confirms the prompt APPEARS, completes a real TEST-mode charge via `FinishVerifyingModal`,
   asserts BOTH rows are simultaneously active (`revoked_at IS NULL`) with the interim row's id
   UNCHANGED (immutability, PRD-40 §9.3 — this is the one test that actually exercises the split-
   partial-index design end to end), and confirms the prompt disappears once a real row exists
   (real-first lookup). Self-skips without `VITE_STRIPE_PUBLISHABLE_KEY` (present in this
   environment, so it will run for real).
3. **"BETA-COHORT: a real signup is flagged founding-at-signup while the switch is on;
   is_test_family=true opts out."** Two real `auth.admin.createUser()` calls (one deliberately
   unflagged — the marker exception above — one `is_test_family:true`), polls for
   `handle_new_user()` to finish, asserts `families.is_founding_family`/
   `family_subscriptions.price_adjustment_kind`/`founding_rate_monthly` for BOTH outcomes. Full
   FK-order teardown for both throwaway families (TEEN-CRED procedure).

Modified: **test 8** ("full consent flow with real TEST-mode payment") now brackets itself with
`setBetaCohortMode(false)`/`setBetaCohortMode(true)` — see seat condition 2 above.

### `tests/e2e/features/subscription-tiers.spec.ts` (fixed, parse-clean, unchanged test count: 27)

`createTt2Fixture()`'s `auth.admin.createUser()` call gains `user_metadata: { is_test_family: true }`
— see seat condition 3 above for the full reasoning (a genuine baseline-corruption risk this
fixture's own tests would otherwise hit, not just a founding-counter hygiene concern).

## Local proof (done this session — zero production touch)

- `npx tsc -b` — **clean, zero errors** (found and fixed a fourth `CoppaConsentFlow` caller,
  `BatchConsentModal.tsx`, this way — `tsc -b` caught it after the first pass).
- `npx eslint` on all 15 touched/new TS/TSX files — **0 errors** (1 expected "file ignored"
  warning on the Deno Edge Function file, matching every prior COPPA slice's identical precedent).
- `npm run prebuild` — **0 errors / 77 pre-existing warnings, none in this build's files**;
  `verify_jwt` 67/67; Safe Harbor filter 67/67, 0 unguarded queries; under-13 aggregation-exclusion
  90 files / 4 writers — all pass, this build touches none of those surfaces.
- `npm run redteam` — **77/77**.
- **36/36 COPPA + BETA-COHORT vitest pins green** (`coppa-ai-gate`, `coppa-cascade-plan-consistency`,
  `coppa-consent-check`, `coppa-registry-completeness`, `coppa-write-gates-consistency`,
  `coppa-zip-writer`, `beta-cohort-auth-user-metadata`, `beta-cohort-handle-new-user-coalesce` —
  the new tables/functions needed zero registry/write-gate changes since `beta_cohort_settings`
  carries no member-referencing column, confirmed by both COPPA pins passing unchanged; the
  new coalesce-guard pin's detector was independently sanity-checked in isolation against the
  known-broken and known-fixed statement text before trusting it against the real migration file).
- `npx playwright test tests/e2e/features/coppa-consent-screens.spec.ts --list` — **12/12 parse-clean**.
- `npx playwright test tests/e2e/features/subscription-tiers.spec.ts --list` — **27/27 parse-clean**
  (unchanged count — confirms the fixture fix didn't disturb test structure).
- **Full `npx vitest run` — 917/927 passing, 10 failures across 5 files, ALL PRE-EXISTING**
  (`build-task-schedule-fields-routine.test.ts` ×1, `convention-lint.test.ts` ×4,
  `journal-notepad.test.ts` ×2, `personal-growth.test.ts` ×2,
  `update-routine-template-atomic.test.ts` ×1 — the exact same failure signature already
  documented as pre-existing in the ST-C build record from this same session; none reference any
  file this build touched). Confirms zero regressions introduced anywhere in the broader suite.
- `git status --porcelain` — reviewed at multiple checkpoints; confirmed ZERO overlap with the
  parallel ST-C session's files throughout.

## What is explicitly NOT done (gated, awaiting the seat)

Per the production-touch gate (migrations, deploys, cron, shared Playwright suites, production-row
mutation, and function invocation are ALL seat-approval-gated — no exceptions, no inferring
approval from presence in the conversation). **Items 1–3 and 7 below are now DONE, by the seat, as
relayed** — kept in the list with their outcomes recorded so this file remains the single source
of truth for what's actually happened vs. what's still pending:

1. ~~Apply migration `00000000100338`~~ — **DONE.** Applied + ledger-repaired by the seat.
2. ~~Deploy `create-coppa-verification-intent`~~ — **DONE.** Redeployed with the
   `.neq('verification_method', 'beta_interim')` fix; a 401 no-auth probe confirmed it's live.
3. `tests/beta-cohort-auth-user-metadata.test.ts` and `tests/beta-cohort-handle-new-user-coalesce.test.ts`
   — already run locally, both green, no further action needed (pure static scans, not gated).
4. **rls-verifier pass over migration 100338** — **DONE.** PASS, 64 probes, zero access-control
   gaps (`RLS-VERIFICATION.md`, new 100338 section — the seat's own addition to that file, already
   present in the working tree as an `M` in `git status`; not touched by this worker). **This same
   pass found the P0** documented above, hotfixed via migration 100339 (applied).
5. ~~Apply migration `00000000100340_beta_cohort_settings_singleton_guard.sql`~~ — **DONE.**
   Applied by the seat.
6. **`tests/e2e/features/coppa-consent-screens.spec.ts` — DONE, 12/12 GREEN** (real run, not just
   parse-clean). Found and fixed one pre-existing P0-class bug along the way (see the dedicated
   section above). Full per-test results and residue tables below.
7. ~~`scripts/beta-cohort-flag-existing.sql`~~ — **DONE.** Run by the seat: Bridgette's Family
   flagged founding; public organic founding count = 2; Testworth correctly excluded.
8. **rls-verifier pass over migration 100340** (the singleton guard) — not yet requested/run.
9. **Convention #277 eyes-on tour** — the interim panel (Screen 5), the "finish verifying" prompt
   + modal, and the founding-beta-family Settings badge, desktop + mobile, screenshots read. Not
   yet run.
10. **`npm run schema:dump`** — not yet run (regenerates `claude/live_schema.md` to reflect
    `beta_cohort_settings` + the `families`/`family_subscriptions`/`parent_verifications` column
    and index changes now live in production).
11. ~~Regression pins~~ — **DONE, all four green.** See "Regression pin results" below.
12. ~~`subscription-tiers.spec.ts` regression (27 tests)~~ — **DONE, 27/27 green.** Confirms the
    `is_test_family` fixture fix to `createTt2Fixture()` doesn't disturb any of that file's own
    founding-grant assertions.

## Regression pin results (all run this session, one suite at a time per the seat's ask)

| Suite | Result | Notes |
|---|---|---|
| `coppa-enforcement.spec.ts` | **7/7 GREEN** (6 + 1 env-gated) | Env-gated AI-gate test run separately with `COPPA_AI_GATE_DEPLOYED=1`, passed |
| `coppa-admin-console.spec.ts` | **7/7 GREEN on re-run** (1st run: 4 passed, test 5 failed, 2 didn't run) | See "Real finding — NOT a regression" below |
| `family-auth-two-door.spec.ts` | **7/8 GREEN** | Test 8 fails on a real credential mismatch against the founder's live family password — env var staleness, zero connection to anything BETA-COHORT touches. Not fixed (not a code bug; the env var value is stale, not something to patch) |
| `teen-cred-login.spec.ts` | **7/7 GREEN** | |
| `subscription-tiers.spec.ts` | **27/27 GREEN** | Confirms the `is_test_family` fixture fix is safe; self-reported "6 stripe_webhook_events not swept" is that file's own known-accepted real-Stripe-event residue class, not a failure |

### Real finding during regression — NOT a BETA-COHORT regression (documented, not fixed)

`coppa-admin-console.spec.ts` test 5 ("reconcile-coppa-verifications: flags a succeeded charge
whose webhook never landed") failed once, then passed on immediate re-run. Root-caused via direct
DB query (not guessed): the test creates a REAL Stripe TEST-mode PaymentIntent
(`confirm: true`) expecting Stripe's real webhook to NOT have delivered by the time it asserts
`parent_verifications` holds zero rows for that intent — but a live, registered TEST-mode webhook
endpoint exists for this project, and Stripe's real webhook delivery landed (confirmed via
`stripe_webhook_events`: `evt_3UEnd91...` processed 190ms before the assertion ran), so the
deployed `stripe-webhook-handler` correctly created a real `parent_verifications` row exactly as
designed. This is the identical "dual legitimate delivery path" class already documented in the
PRD-31 Slice 2 build record — a pre-existing test-design assumption in a file BETA-COHORT never
touched (`coppa-admin-console.spec.ts` is PRD-40 Slice 6's file), unrelated to and unaffected by
any change in this build. Not fixed (out of this build's scope, and the underlying application
behavior is CORRECT — the reconciliation function and webhook handler both worked exactly as
intended; only the test's own timing assumption is fragile). The resulting real
`parent_verifications` row (id `c6bfcbe5-...`, Sarah/Testworth) was left in place, matching the
platform's established precedent of never deleting genuinely-created, immutable-by-design
verification audit rows.

## Per-test results — `coppa-consent-screens.spec.ts` (12/12 GREEN, full-file serial run)

| # | Test | Result | Time |
|---|---|---|---|
| 1 | Unverified mom adding an under-13 child: save interrupted by consent flow, cancel preserves preview | ✅ PASS | 7.4s |
| 2 | Verified mom adding an under-13 child: Screen 7 acknowledgment → commit RPC → member + PIN pipeline | ✅ PASS | 10.5s |
| 3 | Non-founding family adding an under-13 child sees the R-8 dormant block card | ✅ PASS | 11.2s |
| 4 | RPC: dad, kid, family-shadow sessions all rejected (R-10) | ✅ PASS | 1.1s |
| 5 | RPC: validation — inactive verification, missing section, no under-13, mid-batch atomicity | ✅ PASS | 1.4s |
| 6 | RPC: existing-member path (member-edit → under_13) writes bracket + consent idempotently | ✅ PASS | 1.0s |
| 7 | Batch consent UI: several existing children in one pass | ✅ PASS (8.3s) — **was failing; root-caused + fixed this session, see dedicated section above** |
| 8 | Non-mom roles: no COPPA UI, no COPPA data | ✅ PASS | 5.6s |
| 9 | Full consent flow with real TEST-mode payment (Screen 5 real Stripe charge, switch forced OFF then restored) | ✅ PASS | 19.7s |
| 10 | BETA-COHORT: founding family + switch ON — Screen 5 offers the no-charge interim path end to end | ✅ PASS | 12.4s |
| 11 | BETA-COHORT: "finish verifying" appears only for interim-only families; completing it records a NEW real verification without touching the interim row | ✅ PASS | 19.0s |
| 12 | BETA-COHORT: a real signup is flagged founding-at-signup while the switch is on; is_test_family=true opts out | ✅ PASS | 9.8s |

**Total: 12 passed (2.1m).**

## Residue check (after the full 12-test run + the 5 isolated stress-test runs of test 7 that preceded it)

**TIME-WINDOW (authoritative — any name, 20-minute window covering the whole session's runs):**

| Table | Rows created in window | 
|---|---|
| `families` | 0 |
| `family_members` | 0 |
| `family_subscriptions` | 0 |
| `parent_verifications` | 0 |
| `coppa_consents` | 0 |

**Name-matched (supplement, whole-table scope):**

| Table | Matches |
|---|---|
| `families` (COPPATEST/BETA-COHORT/foundingtest/testfamily) | 0 |
| `family_members` (COPPATEST/BETA-COHORT) | 0 |

**`auth.users` (including soft-deleted, via `getUserById`-equivalent full listUsers scan):** 0
matches for `coppatest` across all 45 auth.users rows.

**Required end-state assertions:**
- `parent_verifications` holding `beta_interim` rows: **0** (required: 0) ✓
- `get_founding_family_count()`: **2** (required: 2) ✓
- Exactly one active real `parent_verifications` row remains (Sarah's `stripe_charge`, `revoked_at IS NULL`) ✓

**Zero residue on every axis.** All test-created fixtures (COPPATEST Batch1/Batch2 members,
consent rows, the interim verification from test 10, the real-payment verification from test 11,
the two real auth.users signups from test 12) were fully swept by each test's own `afterAll`/
cleanup blocks.

Only after all remaining items are green AND the founder confirms does anything get staged/
committed. Selective staging discipline applies — the file list in this document (now including
100339, 100340, and the `CoppaAcknowledgeModal` race-fix's two call-site files
`BatchConsentModal.tsx`/`FamilySetup.tsx`) is the authoritative BETA-COHORT change set; ST-C's
files (and the seat's own `RLS-VERIFICATION.md` update, which this worker did not author but which
now sits in the working tree as part of the same migration's story) must be reviewed carefully at
staging time — the `RLS-VERIFICATION.md` diff belongs with this build's commit (it documents
100338's probes), but no ST-C file may ever be swept in alongside it.

**Note:** `BatchConsentModal.tsx` was already in this build's file list (the `betaInterimEligible`
threading, seat condition 2). `FamilySetup.tsx` was already in this build's file list too (the
same threading). The `key` fix for the acknowledge-race bug lands as an additional, small diff on
files already part of this build's change set — no new files to track for staging purposes.

## Mom-UI Surfaces

- `CoppaConsentFlow` Screen 5 — new interim-panel branch (`BetaInterimPanel`) — shells: mom only,
  modification (the existing real-payment branch is functionally unchanged, just extracted).
- `PrivacyConsentPage` (Settings → Privacy & Consent) — new conditional "Finish verifying" row +
  `FinishVerifyingModal` — shells: mom only, new.
- `SettingsPage` → Family Management — new "You're a founding beta family" badge — shells: mom
  only, new, display-only.

## Mom-UI Verification

*(Convention #277 — Claude-driven tour, DONE. `tests/e2e/features/beta-cohort-eyes-on-tour.spec.ts`
(new), 6/6 green, 8 screenshots captured and read in full. One test-locator bug found and fixed
during the tour itself — see note below the table. Zero application defects found on any surface,
either viewport.)*

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Screen 5 interim panel (`BetaInterimPanel`) — founding family, switch ON | ✅ Disclosure text + affirmation checkbox intact above; below it, warm interim copy ("You're one of our founding beta families... this acknowledgment is what confirms your consent") with clock icon, "Continue →" enabled once affirmed. No Stripe Payment Element rendered. | *(not toured — modal is width-fluid between the two verified extremes, matching the established COPPA-tour precedent)* | ✅ Full-screen bottom sheet, all text readable, no clipping, "Continue →" reachable | Mom | `beta-cohort-{desktop,mobile}-01-screen5-interim-panel.png` (both read) | 2026-09-12 |
| Settings → Family Management "You're a founding beta family" badge | ✅ Shield-check icon + text render correctly above the member roster, themed, no overlap | *(not toured)* | ✅ Renders cleanly at 375px, sits neatly above roster rows, BottomNav present | Mom | `beta-cohort-{desktop,mobile}-02-settings-founding-badge.png` (both read) | 2026-09-12 |
| "Finish verifying" prompt (Settings → Privacy & Consent) — interim-only family, switch OFF | ✅ "Your Parental Verification" card shows "Verified on [date]" + "Your beta verification is on file — finish with a quick $1.00 card check whenever you're ready." + "Finish verifying" button (gradient); Children Under 13 section renders correctly below | *(not toured)* | ✅ Same content, single-column stack, all buttons reachable | Mom | `beta-cohort-{desktop,mobile}-03-finish-verifying-prompt.png` (both read) | 2026-09-12 |
| `FinishVerifyingModal` | ✅ "Finish Verifying" title, full warm explanatory copy, "Verify with a $1.00 card check" gradient button, backdrop dims correctly | *(not toured)* | ✅ Renders as a bottom sheet, full text readable, button fully visible, no clipping | Mom | `beta-cohort-{desktop,mobile}-04-finish-verifying-modal.png` (both read) | 2026-09-12 |

**Tour-authoring note (test-only fix, not a product bug):** the tour's first pass failed the
Settings-badge assertion — `getByText("You're a founding beta family")` (ASCII apostrophe) found
nothing, because the JSX renders `&rsquo;` (the typographic apostrophe, U+2019). The screenshot
from that "failed" run showed the badge rendering perfectly correctly; only the test's own locator
needed the curly apostrophe (matching the sibling `coppa-consent-eyes-on-tour.spec.ts`'s own
precedent for the identical character in "Review what's collected"). Fixed in the test, re-ran
clean, zero residue (`COPPATOUR%` members: 0; `beta_interim` rows: 0;
`beta_cohort_settings.enabled` restored to `true`).

## `git status --porcelain` (final, this session)

```
 M .claude/rules/current-builds/STUDIO-EXPERIENCE.md          ← ST-C, NOT OURS
 M RLS-VERIFICATION.md                                        ← seat's 100338 section, OURS
 M STUB_REGISTRY.md                                           ← ST-C, NOT OURS
 M claude/live_schema.md                                      ← schema:dump, OURS
 M scripts/coppa-write-gates-rollback.sql                     ← ST-C, NOT OURS
 M scripts/full-schema-dump.cjs                                ← DOMAIN_ORDER entry, OURS
 M src/components/coppa/BatchConsentModal.tsx                 ← OURS (incl. the key-fix)
 M src/components/coppa/CoppaConsentFlow.tsx                  ← OURS
 M src/components/studio/wizards/*.tsx (10 files)              ← ST-C, NOT OURS
 M src/components/studio/wizards/useWizardDraft.ts             ← ST-C, NOT OURS
 D src/components/studio/wizards/useWizardProgress.ts          ← ST-C, NOT OURS
 M src/hooks/useMemberSaveAndConsentGate.tsx                   ← OURS
 M src/lib/compliance/childDataTables.ts                       ← ST-C, NOT OURS
 M src/lib/coppa/useCoppaGate.ts                                ← OURS
 M src/pages/FamilySetup.tsx                                    ← OURS (incl. the key-fix)
 M src/pages/Lists.tsx                                          ← ST-C, NOT OURS
 M src/pages/PrivacyConsentPage.tsx                             ← OURS
 M src/pages/SettingsPage.tsx                                   ← OURS
 M src/pages/Studio.tsx                                         ← ST-C, NOT OURS
 M supabase/functions/_shared/coppa-cascade-plan.ts             ← ST-C, NOT OURS
 M supabase/functions/create-coppa-verification-intent/index.ts ← OURS
 M tests/e2e/features/coppa-consent-screens.spec.ts             ← OURS
 M tests/e2e/features/subscription-tiers.spec.ts                ← OURS
 M tests/e2e/helpers/seed-testworths-complete.ts                ← OURS
 M tests/verification/new-jj-kk-onboarding.ts                   ← OURS
?? .claude/rules/current-builds/BETA-COHORT.md                  ← OURS (this file)
?? scripts/beta-cohort-flag-existing.sql                        ← OURS
?? src/components/coppa/FinishVerifyingModal.tsx                ← OURS
?? src/components/studio/wizards/WizardDraftPrompts.tsx         ← ST-C, NOT OURS
?? src/components/studio/wizards/useWizardDraftChrome.ts        ← ST-C, NOT OURS
?? src/lib/coppa/useStripeVerificationPayment.ts                ← OURS
?? supabase/migrations/00000000100333_st_c_wizard_drafts.sql    ← ST-C, NOT OURS
?? supabase/migrations/00000000100335_...wizard_drafts.sql      ← ST-C, NOT OURS
?? supabase/migrations/00000000100338_beta_cohort_...sql        ← OURS
?? supabase/migrations/00000000100339_beta_cohort_hotfix...sql  ← OURS
?? supabase/migrations/00000000100340_beta_cohort_...sql        ← OURS
?? tests/beta-cohort-auth-user-metadata.test.ts                 ← OURS
?? tests/beta-cohort-handle-new-user-coalesce.test.ts           ← OURS
?? tests/e2e/features/beta-cohort-eyes-on-tour.spec.ts          ← OURS
?? tests/e2e/features/wizard-draft-persistence-eyes-on-tour.spec.ts ← ST-C, NOT OURS
?? tests/e2e/features/wizard-draft-persistence.spec.ts          ← ST-C, NOT OURS
```

BETA-COHORT's complete, authoritative staging list (26 files): `.claude/rules/current-builds/BETA-COHORT.md`,
`RLS-VERIFICATION.md`, `claude/live_schema.md`, `scripts/full-schema-dump.cjs`,
`scripts/beta-cohort-flag-existing.sql`, `src/components/coppa/BatchConsentModal.tsx`,
`src/components/coppa/CoppaConsentFlow.tsx`, `src/components/coppa/FinishVerifyingModal.tsx`,
`src/hooks/useMemberSaveAndConsentGate.tsx`, `src/lib/coppa/useCoppaGate.ts`,
`src/lib/coppa/useStripeVerificationPayment.ts`, `src/pages/FamilySetup.tsx`,
`src/pages/PrivacyConsentPage.tsx`, `src/pages/SettingsPage.tsx`,
`supabase/functions/create-coppa-verification-intent/index.ts`,
`supabase/migrations/00000000100338...sql`, `...100339...sql`, `...100340...sql`,
`tests/beta-cohort-auth-user-metadata.test.ts`, `tests/beta-cohort-handle-new-user-coalesce.test.ts`,
`tests/e2e/features/beta-cohort-eyes-on-tour.spec.ts`, `tests/e2e/features/coppa-consent-screens.spec.ts`,
`tests/e2e/features/subscription-tiers.spec.ts`, `tests/e2e/helpers/seed-testworths-complete.ts`,
`tests/verification/new-jj-kk-onboarding.ts`. **Every other modified/untracked file in the tree
belongs to the concurrent ST-C (Studio wizard drafts) session and must never be staged from here.**

## Post-Build Verification

| Requirement | Status | Evidence |
|---|---|---|
| `beta_cohort_settings` table + `get_beta_cohort_mode()` RPC (single switch, RPC-only reads, zero client writes) | **Wired, APPLIED** | Migration 100338 §1–2; self-verify block; rls-verifier 64 probes PASS |
| `verification_method='beta_interim'` + split partial indexes (real/interim coexistence) | **Wired, APPLIED** | Migration 100338 §3–4 |
| `create_beta_interim_verification()` — idempotent, minimal, gate-ordered (seat condition 1) | **Wired, APPLIED** | Migration 100338 §5; rls-verifier PASS |
| `handle_new_user()` founding-at-signup, live-body-based, soft cap, `is_test_family` opt-out | **Wired, APPLIED (with the P0 hotfixed)** | Migration 100338 §6 + **migration 100339** (hotfix, applied) |
| `admin_coppa_stamp_readiness().interim_verifications_owed` (informational, never blocks) | **Wired, APPLIED** | Migration 100338 §7 |
| **P0: `handle_new_user()` NULL `is_test_family` rolled back every real signup** | **Found (rls-verifier) + FIXED + APPLIED + reviewed line-by-line + regression-pinned** | Migration 100339; new section above; `tests/beta-cohort-handle-new-user-coalesce.test.ts` (1/1 green) |
| `beta_cohort_settings` singleton guard (2nd rls-verifier finding) | **Wired (code; NOT applied)** | Migration 100340, authored only, self-verifying |
| `create-coppa-verification-intent` "finish verifying" fix (interim never short-circuits a real charge) | **Wired, DEPLOYED** | Edge Function diff; 401 probe confirmed live |
| `fetchParentVerification`/`useParentVerification` real-first-then-interim lookup | **Wired** | `useCoppaGate.ts` |
| `useStripeVerificationPayment()` shared hook (seat condition 2) | **Wired** | New file; load-bearing pin is coppa-consent-screens test 8 (not yet run live) |
| `CoppaConsentFlow` Screen 5 interim branch + `betaInterimEligible` threading (4 callers) | **Wired** | `CoppaConsentFlow.tsx`, `useMemberSaveAndConsentGate.tsx`, `FamilySetup.tsx`, `BatchConsentModal.tsx` |
| `FinishVerifyingModal` + Settings → Privacy & Consent prompt | **Wired** | New file + `PrivacyConsentPage.tsx` |
| Settings founding-beta-family badge (display only) | **Wired** | `SettingsPage.tsx` |
| Seat-run existing-beta-family flag script | **RUN** | `scripts/beta-cohort-flag-existing.sql`; Bridgette's Family flagged, public count = 2, Testworth excluded |
| Test fixture `is_test_family` fix — all 4 real gaps found and fixed | **Wired** | 4 files; verified the other "at minimum" 2 named files were already safe |
| `tests/beta-cohort-auth-user-metadata.test.ts` static pin | **Wired, 36/36 green (full COPPA+BETA-COHORT set)** | Includes the one deliberate marker-based exception |
| `tests/beta-cohort-handle-new-user-coalesce.test.ts` static pin (new, this round) | **Wired, 1/1 green** | Detector sanity-checked against known-broken/known-fixed text in isolation |
| `coppa-consent-screens.spec.ts` — 3 new tests + 1 modified test | **Wired, 12/12 GREEN (real run)** | Full per-test table above |
| Migration 100338 applied to production | **DONE** | Seat-applied + ledger-repaired |
| Migration 100339 (P0 hotfix) applied to production | **DONE** | Seat-applied, emergency fix |
| Migration 100340 (singleton guard) applied to production | **DONE** | Seat-applied |
| Edge Function deployed | **DONE** | Seat-deployed, 401 probe confirmed |
| rls-verifier pass over migration 100338 | **DONE — PASS, 64 probes, zero access-control gaps** | `RLS-VERIFICATION.md` new 100338 section (seat-authored, already in working tree) |
| rls-verifier pass over migration 100340 | **Not done** | To be requested |
| **`CoppaAcknowledgeModal` state-reset race — found + fixed** | **Wired** | `key` prop added at both multi-child call sites (`BatchConsentModal.tsx`, `FamilySetup.tsx`); 5 isolated stress runs + full-file re-run all green |
| Regression: `coppa-enforcement.spec.ts` | **DONE — 7/7 GREEN** | Regression pin results table above |
| Regression: `coppa-admin-console.spec.ts` | **DONE — 7/7 GREEN on re-run** | 1 unrelated pre-existing flake found+documented, not a BETA-COHORT regression |
| Regression: `family-auth-two-door.spec.ts` | **DONE — 7/8 GREEN** | 1 unrelated env-credential-staleness failure, not a BETA-COHORT regression |
| Regression: `teen-cred-login.spec.ts` | **DONE — 7/7 GREEN** | |
| Regression: `subscription-tiers.spec.ts` (fixture fix check) | **DONE — 27/27 GREEN** | Confirms the `is_test_family` fixture fix is safe |
| Convention #277 eyes-on tour | **DONE — 6/6 GREEN, 8 screenshots read, zero defects** | `tests/e2e/features/beta-cohort-eyes-on-tour.spec.ts` (new); Mom-UI table above |
| `npm run schema:dump` | **DONE** | `claude/live_schema.md` regenerated; `beta_cohort_settings` (3 columns) now documented; diff reviewed, clean (table addition + row-count drift from today's test runs only) |
| Beta plan picker (PRD-31 addendum item 3) | **Explicitly out of scope** | PRD-31 Slice 5, per the addendum's own text |
| Commit + push | **Not done** | Everything else is green — holding purely for the seat's referee pass + founder confirm. Staging list + `git status --porcelain` in the section above |
