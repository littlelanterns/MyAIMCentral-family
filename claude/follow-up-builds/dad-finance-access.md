# Dad Finance Access (granted view/pay on kids' finances)

**Status:** Follow-up build candidate — scope locked by founder 2026-06-09
**Filed:** 2026-06-09, during the Role-Scoping Leak Pass close-out
**Estimated workers:** 1
**Depends on:** Role-Scoping Leak Pass (shipped 2026-06-09 — migration 100255, `useViewableMembers`)

---

## Founder ask (verbatim intent)

> "For finances, is there a way to grant dad permission to view/edit etc the
> finance/history as well? Because a lot of moms will want that ability for
> them to view and pay/mark paid for the kids."

## Model

Mom always has full finance access. Dad (additional_adult) gets per-kid access
at the level mom chooses, via the standard `member_permissions` grant system —
same pattern as tasks/lists scoping:

- **`view`** — read that kid's ledger, balances, loans on /finances/history and Prize Board
- **`manage`** — additionally record payments / Mark Paid / adjustments for that kid
  (ledger is append-only per Convention #223, so "edit" = inserting payment/adjustment
  rows, never mutating history)

Kid-facing visibility stays governed by `child_can_see_finances` (unchanged).

## Scope

1. **Permission key:** use the already-registered `financial_tracking` feature key
   (verified in `feature_key_registry` 2026-06-09). Seed `permission_level_profiles`
   row(s) for `dad_adults` with `default_permission_level='none'` so it surfaces in
   Permission Hub as grantable.
2. **RLS migration:** extend `ft_scoped_read` + `loans_scoped_read` (created in
   migration 100255) with a granted-read path: additional_adult may read rows where
   `family_member_id` is a kid they hold a non-`none` `financial_tracking` grant for.
   Extend `ft_parent_insert` with a granted-insert path at `manage` level only.
   Check `allowance_periods` (and any Mark-Paid write path) for the same parent-only
   policies and extend consistently.
3. **Route guards:** `/finances/history` and `/prize-board` open for mom OR an adult
   holding ≥1 `financial_tracking` grant (new small guard component or MomOnlyRoute
   extension). Member pickers scope via `useViewableMembers('financial_tracking')`.
4. **Pay flows:** PaymentModal / Mark Paid in Prize Board work for granted kids at
   `manage`; record dad as actor in the transaction `metadata`/audit trail.
5. **Convention amendment:** Prize Board "mom-only" (Phase 3 Connector Layer) becomes
   "mom + finance-granted adults" — needs explicit founder sign-off at build time and
   a CLAUDE.md note.

## NOT in scope

- Special Adult finance access (out — caregivers don't handle money unless a future PRD says so)
- Kid-to-kid visibility changes (`child_can_see_finances` untouched)
- Editing/deleting ledger rows (append-only is non-negotiable, Convention #223)
- Allowance CONFIG access for dad (`/settings/allowance` stays mom-only; this build is
  ledger view + payment execution, not rule-setting) — confirm with founder at dispatch

## Open questions at dispatch

1. Should `manage` dads also see/use the Allowance tab on Prize Board (period close-out,
   grace days), or only Prizes/Balance + Mark Paid? (Recommendation: Mark Paid + ledger
   only; period management stays mom.)
2. Does mom want a notification when dad records a payment? (Cheap to add via
   `notifications` with category='tasks' or a finance category.)
