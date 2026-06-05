# /my-rewards — Kid-Facing Earnings & Prizes Page

**Status:** Follow-up build candidate — not yet scoped
**Filed:** 2026-05-28
**Filed from:** View As Identity-Scope Architecture build (Q2a founder decision — kid version of Prize Board)
**Estimated workers:** 2-3
**Estimated calendar time on branch:** 2-3 days
**Live-app downtime:** zero (feature branch strategy)

---

## What this build is for

Build the kid-facing `/my-rewards` page — the surface a kid sees (via hub login OR mom-via-View-As) when they want to know "what have I earned, what's in my balance, what prizes do I have waiting?" The View As Identity-Scope Architecture build creates the stub (sidebar entry, route registration, `PlannedExpansionCard`, per-child `show_my_rewards` toggle). This build replaces the `PlannedExpansionCard` with the real page.

---

## Why we're doing it

Founder decision 2026-05-25:

> "I do want there to be a kid version of of the prize board, so the kid can see only what they themselves have earned as far as prizes, allowance, money for tasks or accomplishments etc."

Prize Board (`/prize-board`) is mom-management — Mark Paid buttons, all-kid balances, allowance config dispatch. Hard-blocked from non-mom shells per the View As build's mom-only routes list. Kids who care about "how much do I have" need their own surface.

The architecture for visibility/gating already lands in the View As build:

- `show_my_rewards` boolean on `family_members.preferences` (per-child toggle, mom controls)
- `/my-rewards` route registered in router and View As modal allowlist
- Sidebar entry conditional on `show_my_rewards` AND effective member having earned anything
- Gated by `child_can_see_finances` per pool (PRD-28)

What's missing is the page content itself.

---

## Strategy — feature branch, 2-3 worker split

Feature branch (`my-rewards-kid-page`). Page rendering only — no schema changes, no new permission model.

### Worker 1 — Data hooks + page scaffold

- New page component at `src/pages/MyRewards.tsx`
- Data hooks (likely new file `src/hooks/useMyRewards.ts`):
  - `useMyAllowanceBalances(memberId)` — per-pool current balance from `financial_transactions` for the effective member
  - `useMyRecentEarnings(memberId, days)` — recent earning transactions filtered by `transaction_type IN ('allowance', 'job_reward', 'bonus')` and `family_member_id=memberId`
  - `useMyPendingPrizes(memberId)` — IOUs from `earned_prizes` where `redeemed_at IS NULL` for the effective member
  - `useMyTotalEarned(memberId, periodType)` — aggregate over a configurable period
- All hooks use `useEffectiveMember()` to resolve which member's data to query (Convention #39 — the page works correctly for both mom-via-View-As and kid-via-hub)
- All queries respect `child_can_see_finances` per pool — if the toggle is off for a pool, that pool is silently omitted (not shown as "hidden"; just absent)
- Page scaffold renders the data with placeholder components; UI polish is Worker 2

### Worker 2 — UI components

- BalanceCard component — per-pool balance display, color-coded by pool theme
- RecentEarningsList component — last N earnings, grouped by day, with what-they-did context
- PendingPrizesList component — IOUs and prizes waiting to be received
- Optional: AggregateSummary card — total earned this period, fun framing ("You've earned $42 this month!")
- Theme tokens only — never hardcode hex. Follows existing card patterns from PrizeBoard (`src/pages/PrizeBoard.tsx`)
- Responsive design — mobile-first, works on tablet/hub viewport
- Empty states for: no earnings yet, no pools configured, no pending prizes

### Worker 3 — Play shell variant + permission edge cases + Mom-UI verification

- Play shell hides money values per Convention #221. For Play kids whose mom has enabled `show_my_rewards`:
  - Show prizes/IOUs (visual, not numeric)
  - Show creature/page unlock progress (Convention #198 sticker book)
  - Do NOT show dollar amounts, even if `child_can_see_finances` is on for some pools
- Permission edge cases:
  - `show_my_rewards=false` → route returns a `PlannedExpansionCard` or null; sidebar item not rendered
  - `child_can_see_finances=false` for all pools → page renders prizes/IOUs only, no balance section
  - Kid in member_session via hub vs mom-via-View-As → same data, different attribution context (`useEffectiveViewer.realHumanIsTarget`)
- Mom-UI verification: this is a kid-facing surface AND a mom-via-View-As surface. Both must verify.

---

## Blockers / prerequisites

- **View As Identity-Scope Architecture build must close first.** This build depends on the stub (sidebar entry, route, toggle) landing first, and on the `useEffectiveMember()` / `useEffectiveViewer()` hooks being available.
- **Supabase Generated Types Foundation build is OPTIONAL but recommended first.** Queries against `financial_transactions`, `earned_prizes`, `member_creature_collection`, etc. would benefit from compile-time type safety. If that build closes first, Worker 1's hooks are safer. If not, runtime smoke tests carry more weight.
- **Phase 3.5 Multi-Pool Allowance is already complete.** Per-pool queries can use the existing pool-scoped RPCs.

---

## What NOT to do

- **Duplicate Prize Board UI.** Prize Board is mom-management. `/my-rewards` is kid-facing. Different audience, different framing, different actions. A kid does not see "Mark Paid" buttons — they see "You earned this."
- **Allow ANY mom-only action on this page.** No editing balances. No editing transactions. No editing prize fulfillment status. View-only for kids. The mom-only side stays at `/prize-board`.
- **Hardcode the per-child toggle bypass for any role.** If `show_my_rewards=false`, the page is unavailable. Even mom-via-View-As respects the toggle (she set it; she can change it from settings).
- **Show dollar amounts in the Play shell.** Convention #221 is non-negotiable. Play surfaces visualize earnings (creatures, pages, prizes) not money.
- **Ship without empty-state design.** Many kids will land here before they've earned anything. The first impression has to be motivating ("Your earnings will show up here!"), not blank.

---

## Open questions for the founder at dispatch time

1. **Page name in UI.** "My Rewards" (current working name), "My Earnings", "What I've Earned", or a kid-warmer phrase? Affects sidebar label, page header, empty-state copy.
2. **Aggregate periods.** Show "this week", "this month", "all time"? Single fixed period or kid-selectable?
3. **Tap behavior on a prize/IOU.** Read-only detail modal? Or does the kid get to tap "I want to redeem this" and notify mom? (Latter is a write action; might belong in a follow-up.)
4. **Earnings narrative.** Show the source task/contract name for each earning entry, or just amount + date? Source name is more meaningful but exposes the contract/task structure to the kid.
5. **Independent vs Guided framing.** Same page for both, or two variants? Recommendation: same page, theme tokens adapt automatically via shell.

---

## Related

- **View As Identity-Scope Architecture build** — ships the stub this build replaces
- **Convention #221** — Play shell hides money
- **Convention #224** — `child_can_see_finances` per pool (PRD-28)
- **PRD-28 Tracking, Allowance & Financial** — `financial_transactions`, allowance schema
- **Phase 3 Connector Layer** — `earned_prizes`, `contract_grant_log` for prize/IOU data
- **Phase 3.5 Multi-Pool Allowance** — per-pool balance computation
