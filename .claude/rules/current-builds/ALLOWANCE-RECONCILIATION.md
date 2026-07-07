# Active Build: ALLOWANCE-RECONCILIATION — Prize Board Allowance ↔ Balance Settlement

> **Status: COMPLETE + COMMITTED (founder-approved 2026-07-07 "run those, then commit"). All proof green: new pin 5/5, tsc, lint, zero fixture residue, permissions-wiring 14/14, fo-command-center 9 passed + 2 flaky-then-passed + the known pre-existing "Deploy all" flake confirmed non-reproducing in isolation (same flake documented in the CLIENT-DATE-REMEDIATION record; zero code overlap with this build). Migration 100288 + data repair applied to production. NOT pushed — push on founder's word.**
> Origin: founder question 2026-07-07 — "why aren't the numbers between allowance and balance/balance owed reconciling for my kids?" Investigated, root-caused against live production data, then founder-approved full cleanup + fix same session.
> Session: Fable (diagnosis is a judgment task; implementation was small and same-session).
> Migration: `00000000100288_allowance_payment_settlement.sql` (applied via `db push` after verifying local=remote through 100287 — my file was the only pending one).

## Root cause (verified against production, kid by kid)

The platform tracked "what mom owes" in TWO places — unpaid `allowance_periods` rows (`status='calculated'`, the Allowance tab's "owed") AND the `financial_transactions` ledger (the Balance tab) — but only ONE of the three payment entry points updated both:

| Payment path | Recorded payment | Closed periods |
|---|---|---|
| Prize Board Allowance tab "Paid"/"Pay All" | ✓ | ✓ (client-side, after payment) |
| Prize Board Balance tab "Pay" | ✓ | ✗ NEVER |
| FO Finances "Pay All" | ✓ | ✗ NEVER |

Production evidence at diagnosis: **Gideon showed $40.86 owed but $35.41 had been paid Jun 23 via Balance tab** (truly owed $5.45 = his balance); **Helam showed $23.22 owed, ALL of it already paid** (−$17.68 Jun 24, −$5.54 Jul 7); **Mosiah** was $0.29 off (a manual recalc raised a period $7.10→$7.38 with no ledger adjustment + a $0.01 test payment by Jerrod on Jun 10). Two aggravating dead-ends: `useCreatePayment` clamped to balance and THREW at $0 (Helam's stale owed was un-clearable through the UI), and $0.00-earned periods could never be marked paid (payAmount≤0 guard), piling up since April.

## What shipped

**Data repair (applied to production 2026-07-07, idempotent script in session scratchpad, recorded here):**
- Closed Gideon's 5 already-paid periods ($35.41 exactly matching the Jun 23 payment) and Helam's 6 (matching $17.68 + $5.54).
- Closed all $0.00-earned 'calculated' periods family-wide (unpayable dead rows).
- Two Mosiah adjustments (+$0.28 recalc correction referencing the Apr 26–May 2 period; +$0.01 reversing Jerrod's test payment) — append-only, Convention #223 reversal style. One metadata fix: staggered the second row's created_at by 1ms (both rows landed same-timestamp in one transaction, which the old latest-row balance RPC resolved nondeterministically — the observation that motivated fix 2 below).
- Post-repair verification: every kid reconciles — Gideon 5.45/5.45, Helam 0/0, Mosiah 31.30/31.30, Miriam 3.72/3.72, Casey 126/126; ledger drift 0.00 across all members.

**Migration 100288:**
1. `settle_calculated_allowance_periods(p_member_id, p_period_ids DEFAULT NULL, p_allocate_amount DEFAULT NULL)` — SECURITY DEFINER, EXECUTE to authenticated only. Explicit mode closes exactly the named 'calculated' periods; allocate mode walks oldest-first (period_start, pool_name), closes fully-covered periods, always closes $0-earned rows, and stops at the first nonzero period that doesn't fit (never settles a newer week over an older open one). Permission = primary_parent of the kid's family OR additional_adult with `util.finance_grant_level(kid) IN ('contribute','manage')` — matches Convention #274's "Mark Paid = contribute" ruling while the raw `allowance_periods` UPDATE policy stays manage-only.
2. `calculate_running_balance` rewritten to `SUM(amount)` (was: `balance_after` of newest row by created_at — vulnerable to same-timestamp ties and stale-read chaining). Order-independent ground truth per Convention #223; verified a behavioral no-op at apply time (0 drift). `balance_after` stays on every row as audit trail.

**Client (all payment paths now settle):**
- `useCreatePayment` calls the settlement RPC after recording the payment: explicit ids when the caller passes `settlePeriodIds` (Allowance tab), oldest-first allocation otherwise (Balance tab "Pay", FO "Pay All" — zero changes needed at those call sites). Settlement failure never fails the payment (warn + catch; next payment's allocation catches up). New `CreatePaymentResult` return shape; when balance is $0 and explicit ids are passed, NO transaction is written — periods are just marked settled (fixes the Helam dead-end). Invalidations extended: unpaid-allowance-periods, period-history, member-ledger, family-ledger.
- `PaymentModal`: clamp honesty — when part of the requested amount was already paid out it says so and records only the balance; at $0 the button becomes **Mark Settled** with explainer copy. New optional `settlePeriodIds` prop.
- `PrizeBoard` Allowance tab: passes period ids through the modal into the hook; the old client-side close-after-payment (which diverged whenever the payment threw) is deleted. Also fixed a landing-tab race: `useViewableMembers`' briefly-false `isMom` bounced mom off the Allowance tab onto Prizes on slow loads (found by pin 2's failure — real pre-existing bug).
- `LedgerView`: by-child header balances now computed as SUM(amount) over each kid's UNFILTERED transactions (parent-computed so display filters can't distort them) — consistent with the new RPC.

## Proof

- `tests/e2e/features/allowance-payment-settlement.spec.ts` — **5/5 green**, RECONFIX fixtures on Alex (Testworth kid with no real allowance data; his real $23.00 balance restored exactly, asserted in afterAll + verified by direct SQL: 0 residue rows):
  1. Balance tab full-balance pay → payment recorded AND both calculated periods closed (THE original bug path)
  2. Allowance tab targeted Paid → payment −$4.00 + exactly that period closed
  3. Zero-balance "Mark Settled" → period closed, NO new payment row, clamp copy asserted (the live Helam dead-end)
  4. Kid session calling the settlement RPC → 'Not authorized'
  5. `calculate_running_balance` === SUM(amount)
- `tsc -b` exit 0; eslint 0 errors 0 warnings on all touched files.
- Regression suites NOT yet run (shared-fixture rule — founder go-ahead requested): `permissions-wiring.spec.ts` (pins Mark Paid / Balance tab / ledger) and `fo-command-center.spec.ts` (pins FO Finances Pay All).

## Known behaviors / filed follow-ups (not built this pass)

- **Partial untargeted payments smaller than the oldest open period settle nothing** (periods have no partial-paid state; full-balance pays — the normal flow — always cover everything now that data is consistent). Inherent; revisit only if it bites.
- **Edge Function `calculate-allowance-period` still creates $0-earned periods as 'calculated'** — they're now closable via the UI (Mark Settled) and auto-close on any settlement pass, but closing them at calc time needs an Edge Function deploy (founder-gated). Filed.
- **Edge Function loan auto-deduct branch writes corrupt per-row `balance_after`** (adds the full payout once per loan iteration; final allowance row ignores the deduction). Dormant — 0 loans in production — and no longer corrupts the live balance since the RPC sums, but the rows would look wrong in the ledger. Fix with the next Edge Function pass. Filed.
- **Measurement-only pools' periods would count in "owed"** (their earnings never post to the ledger). No measurement-only pools exist in production. Filed.

## Files (selective staging set — no overlap with other in-flight sessions' files)

- `supabase/migrations/00000000100288_allowance_payment_settlement.sql` (new)
- `src/types/financial.ts`, `src/hooks/useFinancial.ts`, `src/features/financial/FinancialModals.tsx`, `src/features/financial/LedgerView.tsx`, `src/pages/PrizeBoard.tsx` (modified)
- `tests/e2e/features/allowance-payment-settlement.spec.ts` (new)
- `.claude/rules/current-builds/ALLOWANCE-RECONCILIATION.md` (this file)

Close-out after founder sign-off: `npm run schema:dump` is NOT needed (no table shape changes — functions only; dump script captures tables), STUB_REGISTRY follow-up entries, WIRING_STATUS row, archive this file to `.claude/completed-builds/2026-07/`.

## Mom-UI Verification

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Balance tab Pay → periods settle | ✅ (Playwright-driven, DB-asserted) | — | — | Mom | Pin 1 | 2026-07-07 |
| Allowance tab Paid flow + modal | ✅ (Playwright-driven, copy asserted) | — | — | Mom | Pin 2 | 2026-07-07 |
| Mark Settled zero-balance state (copy + button render asserted) | ✅ | — | — | Mom | Pin 3 asserts the "$0.00 … Mark Settled" copy renders | 2026-07-07 |
| Tablet/mobile pass + founder spot-check of the two new modal notes | ⚠ pending | ⚠ pending | ⚠ pending | Mom | Layout unchanged (modal is size='sm', notes are one text block) — quick founder glance or a tour pass before close-out | — |

## Post-Build Verification

| Requirement | Status | Evidence |
|---|---|---|
| Data repair: Gideon/Helam stale periods closed, $0 dead rows closed, Mosiah ±$0.29 | **Wired** | Post-repair SQL: all kids reconcile, drift 0.00 |
| Settlement RPC (explicit + allocate + permission check) | **Wired** | Migration 100288 applied; pins 1–4 |
| SUM-based `calculate_running_balance` | **Wired** | Migration 100288; pin 5 |
| All 3 payment paths settle periods | **Wired** | Balance tab + Allowance tab pinned; FO Pay All uses the same hook (allocation default), no call-site change needed |
| Zero-balance / clamped-payment honesty (Helam dead-end) | **Wired** | Pin 3 + PaymentModal copy |
| Allowance-tab landing race (mom bounced to Prizes) | **Wired** | `isMomRole` in canSeeAllowanceTab; found via pin 2 failure |
| LedgerView header balances = SUM | **Wired** | Code + pin 5 invariant |
| tsc -b / lint clean | **Wired** | Exit 0 / 0 problems |
| Fixture residue zero | **Wired** | Direct SQL: 0/0/0 rows, Alex balance exactly restored |
| Regression suites (permissions-wiring, fo-command-center) | **Wired** | 14/14; 9+2-flaky-passed + known Deploy-all flake green in isolation |
| Commit | **Wired** | Founder-approved 2026-07-07; selective staging, this build's 8 files only |
| Push | **Pending founder** | Commit is local until she says push |
