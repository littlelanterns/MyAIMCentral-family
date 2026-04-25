# REWARDS / EARNING / GAMIFICATION SURFACE RECON — 2026-04-25

> Worker: REWARDS-RECON
> Worktree: `c:/tmp/recon-rewards-2026-04-25/`
> Branch: `recon/rewards-2026-04-25`
> Investigative-only. No code changed. No migrations.
> Six parallel subagents (A: allowance, B: opportunities, C: gamification, D: currencies, E: reveals, F: kid-facing UI).
> Founder addendum 2026-04-25: §5 + §6 merged into single Earnings page architecture.

---

## §1 — EXECUTIVE SUMMARY (read this first)

You have **five different things** a kid can earn in this app, plus **two redemption surfaces** that handle some of them, plus **a sixth thing** (reveal animations) that wraps the rest. That's why your mental model feels jumbled — there really are six moving parts, and the codebase reflects that.

Here's the plain-English map:

1. **Allowance money** (real dollars). Earned by completing tasks tagged "counts for allowance." A weekly percentage drives a payout. **Working today** as of 2026-04-24 — the forward write (NEW-NN) and reverse path (NEW-HH) both shipped.
2. **Opportunity money** (real dollars, separate pool). Earned by claiming and completing optional jobs. **Different from allowance** — opportunities pay their own dollar amount, separate from the weekly percentage. **Working today** — same forward/reverse path.
3. **Gamification points** (display-only). Earned on every task completion when the kid has gamification turned on. **Cannot be spent inside the app.** They're a counter that drives creature rolls and progress feel.
4. **Stars** (a label, not a separate currency). Same number as gamification points — just renamed for Play-shell kids. So a Play kid sees "5 stars" and a Guided kid sees "5 points," but it's the same column.
5. **Creatures + sticker pages + coloring reveals** (collectible images, no spend). Earned on task completion via the gamification roll. **Cannot be redeemed** — they're trophy-case style.
6. **Custom rewards / privileges / photos** (text + image promises). Mom writes "extra screen time" or attaches a photo. The kid sees the prize when they earn it. Mom is supposed to deliver it manually. There's a Prize Box that shows earned-but-not-redeemed prizes for Play kids — but **no equivalent for Guided/Independent kids**, and no queue that reminds mom which privileges she still owes.

The big confusions you're feeling have real roots:

- **"Extra Credit" vs "Opportunity Earnings"** — these are genuinely different things. Extra Credit *boosts your allowance percentage* (numerator-only, capped at 100%) without changing how many tasks were assigned. Opportunity Earnings *put real dollars into a different pool*, separate from the weekly allowance amount. They look similar on the surface ("ways for a kid to earn more"), but they touch different math and different ledger entries.
- **"Points" overloaded three ways** — `gamification_points` (the display counter, dead-end), `allowance_points` (per-task weight in the allowance percentage calc), and `points_override` (per-task gamification override). Three different things, all called "points" in code and UI.
- **"Stars" is just a label** — there is no Stars table, no Stars ledger. It's the same `gamification_points` column with a different display name for Play kids. So when a kid asks "can I trade stars for screen time?" the answer is no — there's no spend path anywhere.
- **The tracker money-source idea (NEW-XX) feels crowded** — that's because the widget today is trying to summarize the whole financial picture in a sparkline-sized space. You're right that it should be a snapshot of a real page, not a self-contained finance dashboard.

Per your design call this morning, the recommendation in §6/§9 is **a single merged "Earnings" page** containing every reward stream + the gamification collection + the prize box, all in one destination. Widget on dashboard = snapshot, tap → full page.

The app has the *plumbing* for almost everything you want (forward writes, reverse RPC, reveal library, prize box, allowance progress RPC). What it's missing is the **single destination that ties the streams together for the kid**, and a few specific gaps:

- No central "kid Finance / Earnings" page (only `/finances/history` for transactions and `/rewards` for Play kids' Prize Box)
- No mom-side queue for delivering custom privileges (Prize Box exists but only for `reward_reveals` — not for `task_rewards.reward_type='privilege'/'custom'`)
- Reward reveal infrastructure built but disconnected (`reward_reveals` and `reward_reveal_attachments` are 0 rows in production — no settings UI to create them, no completion hook to trigger them)
- Gamification points (and stars) are dead-end currencies — earned but unspendable. NEW-QQ flagship plans to fix this; NEW-YY adds the categorization wrinkle.

The good news: most of this is **renaming and unification work**, not rewriting. The streams are solid; they just need to live in one place with consistent vocabulary.

---

## §2 — THE FIVE EARNING STREAMS

For each stream: how earned, where stored, where displayed, where (if anywhere) spent or redeemed, what's stubbed.

### Stream 1 — Allowance Percentage

```
Task completion → calculate_allowance_progress RPC reads tasks + completions live
                → returns completion %, computes calculated_amount + bonus
                → at period close: Edge Function writes financial_transactions
                  row (transaction_type='allowance_earned')
```

- **How earned:** Tasks tagged `counts_for_allowance=true` enter the weekly pool. Completion percentage drives a payout per `allowance_configs` (fixed amount × pct, or dynamic, or points-weighted).
- **Where stored:** `allowance_periods` (per-period tally) + `financial_transactions` (append-only ledger row at period close).
- **Where displayed:** `AllowanceCalculatorTracker` widget (compact = "% done" or "$X.XX" depending on `child_can_see_finances`; full = numerator/denominator + progress bar + earned amount + bonus badge).
- **Where spent:** Mom can mark `payment_made` transaction. No kid-facing spend UI.
- **Stubbed:** Loan interest accrual cron registered but Edge Function not implemented (Subagent A item 7.1).

### Stream 2 — Extra Credit

```
Task with is_extra_credit=true AND counts_for_allowance=true
   → completed → boosts numerator only (excluded from denominator)
   → completion % rises but capped at 100%
   → no separate ledger row — just nudges the same allowance % calc
```

- **How earned:** Mom flags a task `is_extra_credit=true`. Per Convention #224 / migration 100170, it must also be `counts_for_allowance=true` AND non-routine to qualify.
- **Where stored:** `tasks.is_extra_credit` (boolean, default false). `allowance_periods.extra_credit_completed` (audit count). RPC consumes per migration 100171:176-188.
- **Where displayed:** No separate UI surface today. Folded into the allowance percentage. No "you earned X% boost from extra credit" callout.
- **Stubbed:** No kid-facing entry point that says "complete an extra-credit task." Mom can flag, but nothing nudges the kid to find them.

### Stream 3 — Opportunity Earnings

```
Opportunity task (task_type LIKE 'opportunity_*') with task_rewards.reward_type='money'
   → kid completes (and mom approves if required)
   → awardOpportunityEarning() helper in useTasks.ts:99-199
   → writes financial_transactions row (transaction_type='opportunity_earned',
     source_reference_id=task_completions.id)
   → idempotent via partial unique index uq_financial_transactions_forward_per_completion
```

- **How earned:** Three sub-types — `opportunity_claimable` (claim-and-lock-then-complete), `opportunity_repeatable` (cooldown gated), `opportunity_capped` (max-N total). All can pay money via `task_rewards`.
- **Where stored:** `financial_transactions.transaction_type='opportunity_earned'`. Reverse RPC `reverse_opportunity_earning(p_completion_id)` armed in migration 100173 — fires from `useUncompleteTask` fire-and-forget.
- **Where displayed:** Same financial widget. NOT differentiated from allowance dollars on the widget today (NEW-XX would fix).
- **Where spent:** Same as allowance — mom marks paid. No kid spend.
- **Stubbed:** Per-line-item reward picker (NEW-WW, Beta=Y, not built). Cascade: Reward Type → Money/Points/Extra Credit/Custom (text + photo) → reveal wrapper → deploy list or item.

### Stream 4 — Gamification Points / Stars / Streaks

```
Task completion (completion_type IN ('complete', 'mastery_approved'))
   → roll_creature_for_completion(p_task_completion_id) RPC
   → idempotent via member_creature_collection.awarded_source_id UNIQUE
   → increments gamification_points by tasks.points_override OR base_points_per_task
   → updates current_streak (date-aware)
   → rolls d100 against creature_roll_chance_per_task → maybe awards creature
   → checks page unlock thresholds → maybe unlocks page
   → checks coloring reveal earning_task_id → maybe advances reveal step
```

- **How earned:** Every qualifying task completion. RPC has 8+ early-return branches (gamification disabled, already processed, skipped completion type, sticker book disabled, roll failed, theme empty).
- **Where stored:** `family_members.gamification_points` (INTEGER, append-only — no decrement path anywhere in code). `family_members.current_streak` / `longest_streak` / `last_task_completion_date`. `family_members.gamification_level` exists but is never incremented (stub).
- **Where displayed:** PlayDashboardHeader stat pills (Stars / Streak / Creatures). Guided/Independent dashboards show points counter.
- **Where spent:** **Nowhere.** This is a dead-end currency. NEW-QQ flagship plans the spend path. NEW-YY adds categorization (reading-points vs chore-points pools).
- **Stubbed:** Streak grace logic (`streak_grace_used_today` column exists, RPC may not fully consume it — Subagent C bug #4). Gamification level (column + thresholds JSONB exist, no increment code).

### Stream 5 — Creatures, Sticker Pages, Coloring Reveals

```
Same RPC as Stream 4, branches by member_sticker_book_state.creature_earning_mode:
   - random_per_task: d100 vs roll chance
   - every_n_completions: counter-based threshold
   - segment_complete: all tasks in named segment done
   - complete_the_day: all today's tasks done
Page earning: every_n_creatures | every_n_completions | tracker_goal
Coloring reveals: 1:1 task-link via earning_task_id (priority) OR earning_mode fallback
```

- **How earned:** Per the four creature-earning modes (Convention #209) and three page-earning modes (Convention #210). Coloring reveals have a separate task-link path (Convention #211–213).
- **Where stored:** `member_creature_collection`, `member_page_unlocks`, `member_coloring_reveals`. Library tables: `gamification_creatures` (161 rows), `gamification_sticker_pages` (26 rows), `coloring_reveal_library` (32 rows), `reveal_animations` (33-34 rows).
- **Where displayed:** PlayStickerBookWidget on Play Dashboard, StickerBookDetailModal for full view. PlayRewards page (`/rewards`) for Play shell only. **No equivalent surface in Guided/Independent today.**
- **Where spent:** Cannot be spent — collectible-only.
- **Stubbed:** `PageUnlockRevealModal` referenced but no component built (Subagent E bug #1, Convention #204 placeholder banners). Randomizer mastery exits don't fire RPC (Convention #205, known gap). Task unmark cascade for points/streak/creature reversal (Convention #206, known gap).

---

## §3 — THE REWARD CURRENCIES

Every distinct "thing a kid can earn." Source: Subagents B + D + E.

| Currency | Storage | Earned via | Spent / Redeemed | UI Surface | Status |
|---|---|---|---|---|---|
| **Money (allowance)** | `financial_transactions` ledger; running balance via `calculate_running_balance` RPC | Period close after task completion % calc | Mom marks `payment_made` transaction (no kid-facing spend); loans via `useCreateLoan` (built) | AllowanceCalculatorTracker, FinancesTab (mom), TransactionHistoryPage | **Working** |
| **Money (opportunity)** | Same `financial_transactions` ledger, `transaction_type='opportunity_earned'` | Opportunity task completion via `awardOpportunityEarning()` (NEW-NN, shipped 2026-04-24) | Same as allowance — mom marks paid | Same widget — undifferentiated source today (NEW-XX gap) | **Working as of 2026-04-24** |
| **Stars** | `family_members.gamification_points` (NOT a separate column) | Task completion RPC | **DEAD-END** — no spend path | PlayDashboardHeader stat pill (label = "stars" only when `dashboard_mode='play'`) | Dead-end |
| **Gamification Points** | `family_members.gamification_points` | Task completion RPC; `tasks.points_override` overrides `gamification_configs.base_points_per_task` | **DEAD-END** — no spend path | Guided/Independent dashboard counter; Play shows as "stars" | Dead-end |
| **Allowance Points** (weight) | `tasks.allowance_points` (per-task weight) + `allowance_configs.default_point_value` | NOT a kid-earnable thing — this is a *weight* for the allowance percentage calculation when `calculation_approach='points_weighted'` | N/A — used only as numerator weight in the RPC | Hidden in TaskCreationModal "Weight (points)" field per NEW-QQ partial fix | Working but discoverability gap |
| **Special Privilege** (text) | `task_rewards.reward_type='privilege'` + `reward_value` JSONB | Task completion (mom must deliver manually) | **DEAD-END** — text capture only, no delivery queue or audit trail for mom | Visible in task reward display; nowhere mom can see "outstanding privileges" | Compliance gap |
| **Custom Reward** (text + optional photo) | `task_rewards.reward_type='custom'` + `reward_value` JSONB; `reward_reveals.prize_*` (library) + `earned_prizes` (snapshots) | Reward reveal trigger fires on task/widget/list completion per `reward_reveal_attachments.reveal_trigger_mode` | `earned_prizes.redeemed_at` set when mom marks redeemed in PrizeBox; **but only for `reward_reveals` path, NOT for `task_rewards.reward_type='custom'` direct** | PrizeBox (Play shell `/rewards` only) — no equivalent for Guided/Independent | Partial; surface gap |
| **Creatures** | `member_creature_collection` rows | Task completion RPC, mode-dependent | Cannot be spent — collectible | PlayStickerBookWidget, StickerBookDetailModal, PlayRewards page (Play only) | Working in Play; no equivalent surface elsewhere |
| **Sticker Pages** | `member_page_unlocks` rows | Threshold met (every_n_creatures, every_n_completions, tracker_goal) | Cannot be spent — collectible | Same as creatures | Working; reveal modal stubbed |
| **Coloring Reveal Steps** | `member_coloring_reveals.current_step` increment + `revealed_zone_ids` array | Linked task completion advances exactly one zone (1:1 tally) | Print at full reveal — no spend | ColorRevealWidget, ColorRevealCanvas | Working |
| **Reveal Animations** (wrapping paper) | `reveal_animations` library (33-34 rows) | NOT earned directly — they wrap other reveals (creature, page, reward, future task-presentation) | N/A | Currently only wired for creature/page reveals (Sub-phase D placeholder), NOT for `reward_reveals` (0 rows in production) | Library populated, consumers partly wired |

**Dead-end currencies (earned but unspendable inside the app):**

1. **Gamification Points / Stars** — earned every task completion; nowhere to spend. NEW-QQ plans this. NEW-YY plans categorization (reading-pool vs chore-pool).
2. **Special Privilege** — text captured, mom delivers offline; no in-app fulfillment surface or queue.
3. **Custom Reward via `task_rewards`** (not via `reward_reveals`) — no PrizeBox row created because the trigger only fires through reward_reveal_attachments. So when mom sets a task's reward_type=custom inline, the kid sees the promise on the task card but it never lands in any prize-tracking surface.

**Partial-redemption currencies:**

4. **Money (allowance + opportunity)** — kid sees balance; mom marks paid; no kid-facing redemption store. Loans table exists.
5. **Custom Reward via `reward_reveals`** — earned_prizes row created; mom can mark redeemed in PlayRewards/PrizeBox; but PrizeBox is Play-shell only.

---

## §4 — OVERLAP MAP

Where the streams interact, conflict, or duplicate.

### 4.1 — Extra Credit vs Opportunity Earnings (founder's #1 confusion)

These are **different things**:

| | Extra Credit | Opportunity Earnings |
|---|---|---|
| Pool | Allowance percentage (numerator) | Separate $ pool |
| Math effect | Boosts completion % (capped at 100%) | Adds dollars directly |
| Ledger entry | None — folded into period-close `allowance_earned` | Own row: `transaction_type='opportunity_earned'` |
| Required flag | `is_extra_credit=true` AND `counts_for_allowance=true` AND non-routine | `task_type LIKE 'opportunity_*'` AND `task_rewards.reward_type='money'` |
| Cap | 100% completion (per RPC `LEAST` clause) | Per-job dollar amount × `max_completions` |
| Visible to kid | Just sees % go up | Sees the dollar amount on the opportunity card |

**Why they feel the same:** Both are "ways to earn beyond the assigned tasks." Both can pay real money (extra credit indirectly via allowance bonus, opportunities directly). Both surface in the same financial widget. **They are not the same.**

### 4.2 — "Points" overloaded across three meanings

| Field | What it means | What it drives |
|---|---|---|
| `family_members.gamification_points` | The kid's total earned points (counter only) | Display, creature roll input via `points_override` |
| `tasks.points_override` | Per-task override of `base_points_per_task` for **gamification award only** | How many gamification_points this specific task awards |
| `tasks.allowance_points` | Per-task weight for **allowance percentage calc only** | Multiplier in points-weighted allowance calculation_approach |
| `gamification_configs.base_points_per_task` | Default award per task | Default for `points_override` fallback |

**The schema correctly separates these, but the vocabulary doesn't.** The TaskCreationModal field labeled "Weight (points)" is `allowance_points`. The reward-type-points dropdown awards `gamification_points` via `points_override`. Mom doesn't have a way to see at-a-glance which "points" she's configuring.

### 4.3 — Reveal animations shared across surfaces or fragmented?

`reveal_animations` (33-34 rows) is the **shared library**. Currently consumed by:

- Creature reveals (CreatureRevealModal — Sub-phase D placeholder per Convention #204)
- Page unlock reveals (PageUnlockRevealModal — referenced but not built)
- (Intended) Reward reveals via `reward_reveals.animation_ids[]` — wired in schema, dead in UI
- (Intended per Composition Architecture §1.3) Task-presentation reveals — NEW-AA scope

`coloring_reveal_library` (32 rows) is **separate** — different shape (zone-based progressive reveal vs animation→prize-card flow). Not unified with reveal_animations and probably shouldn't be.

**The unification opportunity is between `reveal_animations` and the multiple consumers** — one library, many wrapper points. NEW-AA worker scope.

### 4.4 — Custom Reward double-path

Mom has two ways to attach a custom reward to a task, and they don't behave the same:

| Path | Where stored | Does it land in PrizeBox? |
|---|---|---|
| Task creation → reward_type=custom | `task_rewards.reward_value` JSONB | **No** — no `earned_prizes` row created |
| Reward Reveal (`reward_reveals` library) attached via `reward_reveal_attachments` | `reward_reveals.prize_*` columns | **Yes** — `earned_prizes` snapshot row created on trigger |

**This is a defect.** Mom sets a custom reward inline on a task expecting it to follow through; instead it shows on the card but never enters a tracked-prize state. (Subagent F section 4.)

### 4.5 — `task_rewards` table partial usage

`task_rewards` is mostly used by the opportunity claim flow (`useOpportunityLists.ts:196-203`). Regular task creation flows write `points_override` directly to `tasks` and skip `task_rewards`. The forward-write helper (`awardOpportunityEarning`) reads `task_rewards.reward_type` + `reward_value`. Result: if a non-opportunity task has `reward_type='money'`, no money is awarded because the helper only fires on opportunity task types. Subagent B item 8.

### 4.6 — Stars label vs Points label vs same number

`gamification_configs.currency_name` defaults to `'stars'` for Play kids and `'points'` for everyone else. Same `family_members.gamification_points` underneath. **No actual divergence**, but the overloaded vocabulary makes it look like there are two currencies when there's one. NEW-QQ + NEW-YY should rename to clarify.

---

## §5 — KID-FACING SURFACES (per founder addendum: single merged page architecture)

### 5.1 — Every kid-facing surface today

Source: Subagent F.

| Surface | Path | Shells | Shows | Action |
|---|---|---|---|---|
| AllowanceCalculatorTracker widget | `src/components/widgets/trackers/AllowanceCalculatorTracker.tsx` | Mom, Adult, Independent, Guided (configurable) | Compact: %/$ ; Full: numerator/denominator + progress bar + bonus badge + Today/Week toggle | None (no click-through) |
| PlayDashboardHeader stat pills | `src/components/play-dashboard/PlayDashboardHeader.tsx` | Play only | Stars / Streak / Creatures counters | None |
| PrivilegeStatusTracker widget | `src/components/widgets/trackers/PrivilegeStatusTracker.tsx` | Any (configurable) | Red/Yellow/Green zone + percentage | None (visibility only) |
| PlayStickerBookWidget | (embedded in PlayDashboard) | Play only | Active page thumbnail + creature count | Tap → StickerBookDetailModal |
| PlayRewards page | `/rewards` route | Play only (bottom-nav "Fun" tab) | Sticker book section + PrizeBox | Browse, view earned prizes |
| PrizeBox | `src/components/reward-reveals/PrizeBox.tsx` | Inside PlayRewards (Play only) | Earned `reward_reveals` (text/photo prizes) | Mom: "Mark Redeemed"; Kid: view only |
| FinancesTab | `src/features/financial/FinancesTab.tsx` | Mom only (embedded in `/tasks`) | "What I Owe" per child + recent transactions | Mom redemption / payment workflow |
| TransactionHistoryPage | `/finances/history` | Any | Filterable transaction log | Read-only history |
| OpportunityDashboardView / OpportunityListBrowse | (Tasks page Opportunities tab) | All shells with tasks | Available opportunities + claim buttons | Claim, complete |

### 5.2 — Critical gaps for the founder's design vision

Source: Subagent F section 10.

1. **No primary kid-facing Finance / Earnings page.** Most data is widget-only or buried in `/tasks` or `/finances/history`.
2. **No "Boost Your Percentage" nav path.** Extra credit is a backend toggle; nothing routes the kid TO extra credit tasks.
3. **No "Earn Extra" nav path.** Opportunities live as a tab inside `/tasks`, not as a primary destination.
4. **No mom-side privilege delivery queue.** Custom privileges captured but never tracked; mom has no reminder surface.
5. **PrizeBox is Play-shell only.** Guided/Independent kids who earn `reward_reveals` have nowhere to see them.
6. **Sidebar gaps.** No Finance / Allowance / Earnings entry in any shell's sidebar today.
7. **Widget ↔ page bridge missing.** AllowanceCalculatorTracker has no "see full earnings" tap-target.

### 5.3 — Per founder addendum: single merged Earnings destination

Replace the implied "Finance page + separate Rewards page" with **one page that contains every reward stream and every collection surface in its own section**. Widget on dashboard becomes a snapshot.

#### Proposed sections (founder-listed + worker-confirmed)

| # | Section | Source data | Shell visibility |
|---|---|---|---|
| 1 | **Balance summary** (top-of-page snapshot) | `calculate_running_balance` RPC + member's `gamification_points` + creature count | All shells (gated by `child_can_see_finances`) |
| 2 | **Allowance progress** (current period % + projected payout) | `calculate_allowance_progress` RPC | Mom, Adult, Independent, Guided (Play shows visual variant) |
| 3 | **"Boost Your Percentage"** link/section → extra credit tasks | Filter `tasks WHERE assignee_id=member AND is_extra_credit=true AND status!='completed'` | Mom, Adult, Independent, Guided |
| 4 | **"Earn Extra"** link/section → opportunity tasks | Filter `tasks WHERE assignee_id=member AND task_type LIKE 'opportunity_%' AND available` | Mom, Adult, Independent, Guided |
| 5 | **Recent transactions** | `financial_transactions` ledger filtered + kid-appropriate columns | All shells (gated by `child_can_see_finances`); Play shows visual-only |
| 6 | **Points / stars summary** | `gamification_points` per category once NEW-YY lands; today shows single counter | All shells (Play sees as "stars") |
| 7 | **Creatures + sticker pages collection** (gamification surface, NOT a separate gamification page) | `member_creature_collection` + `member_page_unlocks` | All shells where gamification enabled |
| 8 | **Reveal animations earned but not yet revealed** (worker confirmed: this state DOES exist — `reward_reveal_attachments.times_revealed < trigger_n` for `every_n` mode; `member_page_unlocks` rows with no displayed reveal modal — Convention #204 placeholder) | `reward_reveal_attachments` + `earned_prizes WHERE redeemed_at IS NULL` | All shells |
| 9 | **Custom reward inventory** (text + photo rewards earned but not yet redeemed) | `earned_prizes WHERE redeemed_at IS NULL` (today PrizeBox handles only `reward_reveals` path; the `task_rewards.reward_type='custom'` path is the §4.4 defect — fix opportunity) | All shells (replaces PrizeBox; Play-only today) |
| 10 | **Redemption surfaces** (where applicable; flag dead-end currencies) | Mom: payment button + privilege-deliver button. Kid: read-only with "ask mom" CTA today | Mom (full); kids (read + ask) |

#### Existing surfaces this page REPLACES vs KEEPS

| Surface | Disposition |
|---|---|
| AllowanceCalculatorTracker widget | **Keep as snapshot** — strip down to balance + percentage bar + 1-2 recent earnings; tap → `/earnings` |
| PrivilegeStatusTracker widget | **Keep as snapshot** — same pattern; tap → relevant section of `/earnings` |
| PlayStickerBookWidget | **Keep as snapshot on PlayDashboard** — still the at-a-glance for Play kids; tap → §7 of `/earnings` |
| PlayRewards page (`/rewards`) | **REPLACE** with `/earnings` (Play visual variant) — current PlayRewards + PrizeBox become §7-9 of merged page |
| FinancesTab in `/tasks` | **REPLACE** with `/earnings` (mom view) — mom's "What I Owe" per child becomes the family-level rollup section of `/earnings` |
| TransactionHistoryPage (`/finances/history`) | **MERGE** — becomes drill-down from §5 (Recent Transactions). Could remain as a deeper view or fold entirely. |
| OpportunityDashboardView | **Keep but link** — opportunity surfaces stay in Tasks page Opportunities tab, but `/earnings` §4 "Earn Extra" deep-links to filtered opportunities |

#### Per-shell rendering

| Shell | Variant |
|---|---|
| **Mom** | Full page — every section + family-level rollup ("What I Owe All Kids" header above per-child sections). Mom can switch between "view as me" and "view as [child]" to see what each kid sees. |
| **Adult** | Full page minus family-level config. Sees own balance + own collection. (Adults rarely have allowance configured but may have rewards configured.) |
| **Independent** (teen) | Teen-appropriate — full page but tighter density, fewer celebratory animations, transaction history more prominent (teens want financial detail). Per Convention #200 framing, opt out of childlike visuals. |
| **Guided** (8-12) | Simpler — larger chips, fewer rows per section, "tap to see more" affordances. Same data, less crammed. |
| **Play** (under 8) | Visual-first — replace numeric balance with a visual fill (jar / bucket / progress shape per `gamification_configs.visualization_mode`). Section ordering: collection (§7) FIRST, then prizes (§9), then balance / earning paths last. Reduce text. Per Convention #51 Play uses pure emoji nav. |

#### URL route + sidebar entry

- **Route:** `/earnings` (founder considered `/my-earnings`, `/balance` — recommend **`/earnings`** as the most generic and shortest; covers gamification + financial without privileging either)
- **Sidebar registration:** Per Convention #16, register exactly once in `getSidebarSections()` in `src/components/shells/Sidebar.tsx`. Recommended:
  - **Mom shell:** under "Family" section (between Tasks and Allowance Settings) — entry name "Earnings & Rewards"
  - **Adult shell:** under "Home" section — entry name "My Earnings"
  - **Independent shell:** under "Home" section — entry name "My Earnings"
  - **Guided / Play shells:** Guided gets a tile in "My Day" section; Play replaces current `/rewards` bottom-nav entry with `/earnings` (label tweaked to "Earned" or kept as "Fun" with broader scope)
- **Mobile parity check** per Convention #16: BottomNav More menu reads from `getSidebarSections()` — single registration covers both. Verify in 375px viewport that the new entry appears in the same section / same icon / same position as desktop.

#### RLS / privacy implications

- **`financial_transactions` RLS:** SELECT for family members in same family; INSERT primary_parent only; NO UPDATE/DELETE (append-only). Already enforced. Merging the page surface doesn't change this — kids can READ their own row but cannot INSERT/UPDATE.
- **Convention #225 — financial data excluded from LiLa context:** This is a context-assembly boundary, NOT a UI boundary. The merged page reads `financial_transactions` directly (RLS-gated); LiLa's `_shared/context-assembler.ts` still must NOT load from `financial_transactions`, `allowance_configs`, `allowance_periods`, `loans`. **Confirmed: the boundary holds.** UI surface and context surface are separate concerns.
- **`child_can_see_finances` toggle on `allowance_configs`:** Existing per-child gate. Merged page must respect — when false, replace dollar amounts with percentage / abstract progress (already the AllowanceCalculatorTracker line 174 pattern). Apply consistently across all sections, not just §1-2.
- **Kid sees own gamification only** — `gamification_points`, creatures, pages, prizes are per-member. Mom's "view as" lets her see each kid's surface. No cross-kid leakage.
- **Mom's family-level rollup section** (only visible in Mom shell) — aggregates per-child balances; same as current FinancesTab behavior. RLS allows because mom is `primary_parent` with full family scope.

---

## §6 — PROPOSED UNIFIED MENTAL MODEL

### 6.1 — The 4 clean concepts (founder redesign anchors)

After collapsing the overlap map, the system reduces to **4 concepts** the founder can redesign around. (Originally suggested 3-5; landed on 4 as cleanest.)

1. **Money** — real dollars. One ledger (`financial_transactions`). Two earn paths (allowance percentage payout, opportunity completion). One balance. Categorize the source visibly (NEW-XX) but not architecturally — they're all dollars.

2. **Points** (with categories) — internal currency. One ledger per kid (today: `family_members.gamification_points`; redesign: append-only `points_balance` ledger keyed by category per NEW-QQ + NEW-YY). Earned via task completion. Spent via redemption surfaces (future). Categorized so reading-points don't redeem chore-rewards.

3. **Collectibles** — creatures, sticker pages, coloring reveals. Earned via gamification roll. Cannot be spent. Trophy-case display surface (current sticker book).

4. **Promises** — privileges, custom text rewards, custom photo rewards. Earned at task completion. **Tracked in a unified Promised-Rewards ledger** (today: only `earned_prizes` for `reward_reveals` path; redesign: also for `task_rewards.reward_type='custom'/'privilege'`). Mom delivers; mom marks redeemed.

**Reveal animations** are not a fifth concept — they're a presentation wrapper that any of the four can use (NEW-AA).

### 6.2 — Naming clarity recommendations

Rename to disambiguate:

| Today | Recommended | Why |
|---|---|---|
| `family_members.gamification_points` | `member_points_balance` (single counter) → eventually `member_points_balances` (per-category ledger) | "Gamification" is implementation detail; "points" is the user concept |
| `tasks.points_override` | `tasks.gamification_points_override` | Disambiguate from allowance_points |
| `tasks.allowance_points` | `tasks.allowance_weight` | This is a *weight* (multiplier), not a count of points the kid earns. Removes the "points" overload entirely. |
| `gamification_configs.currency_name='stars'` for Play | (keep, but document) | OK to keep as cosmetic label; just document that it's a label, not a separate currency. Worth noting in CLAUDE.md so nobody builds a "stars table" thinking it exists. |

NEW-QQ flagship can drive these renames. Convention update needed.

### 6.3 — Simpler points categorization than NEW-QQ flagship

NEW-QQ flagship plans full append-only points ledger with earn pathways, spend pathways, decay, redemption UI. NEW-YY adds categories.

A simpler pre-flagship architecture (worker proposal):

- **Phase 0 (rename only, ~1 worker):** Rename gamification_points to member_points_balance. No schema change to ledger structure; this is just clarity work.
- **Phase 1 (categorize without ledger overhaul, ~1 worker):** Add `tasks.points_category TEXT NULL` (NULL = "general" pool). Add `member_points_by_category` materialized view OR per-category running balance triggered on task completion. Mom configures category names + redemption costs. Kid balance shown per category. **No append-only ledger yet** — just per-kid-per-category counter columns.
- **Phase 2 (full ledger, NEW-QQ scope, ~1-2 workers):** Convert per-category counters to append-only ledger with earn/spend transactions. Adds redemption history + decay + audit.

This staging means founder gets the *user-visible* benefit (categorization, "no reading-points-for-chore-rewards") without committing to the full ledger refactor up front. NEW-YY explicitly defers ledger architecture to NEW-QQ — this proposal stages NEW-YY into 0/1 first.

### 6.4 — Reveal wrapper: per-list vs per-item

Both should be supported. Per Composition Architecture §1.3 and Subagent E section 7:

- **Per-list reveal:** `lists.reveal_wrapper_config JSONB` — picks animation + rotation pool. Every task spawned from this list inherits the wrapper. Default behavior for opportunity lists, randomizers, sequential collections.
- **Per-item reveal:** `tasks.reveal_wrapper_config JSONB` (overrides list-level). Plus `list_items.reveal_wrapper_config JSONB` for randomizer/opportunity items that should differ from their parent list. NEW-WW already plans this for opportunity list items.

Schema delta minimum:
- `lists.reveal_wrapper_config JSONB DEFAULT NULL`
- `list_items.reveal_wrapper_config JSONB DEFAULT NULL`
- `tasks.reveal_wrapper_config JSONB DEFAULT NULL`
- `widgets.reveal_wrapper_config JSONB DEFAULT NULL` (for tracker milestone reveals)
- Resolution order: task > list_item > list > none. UI resolves at render time.

NEW-AA worker scope already bundles this with PRD-24B reveal library restructure (SCOPE-3.F30) and connector architecture (SCOPE-2.F61, F62).

### 6.5 — Cascade picker: where does it belong?

NEW-WW currently scopes the per-line-item reward picker to:
- TaskCreationModal (single opportunity task)
- Opportunity list editor in Studio templates
- Lists page list editor

**Worker recommendation: ALSO add it to a new "Reward Configuration" surface inside the merged `/earnings` page (mom-only).** Reasons:
- Mom would benefit from a single place to see "all reward setups across all my kids' tasks" without drilling into individual tasks
- The `/earnings` page is the natural home for reward management (it's where the kid sees the result, so it's where the configuration lives nearby)
- Doesn't replace TaskCreationModal — that stays for in-context configuration. Just adds a secondary entry point.

Rendering: Mom shell only. Section "Reward Setup" near §10 redemption surfaces. Pull from `task_rewards`, `reward_reveals`, `reward_reveal_attachments`. Same shared component as NEW-WW (Convention discipline — single source of truth, no fork).

### 6.6 — Data model unifications worth doing now

Two consolidations the founder may want before the merged page ships:

**A. Resolve the §4.4 Custom Reward double-path.** Inline `task_rewards.reward_type='custom'` should write to `earned_prizes` on completion, same as `reward_reveals` does. Either:
- Refactor inline custom rewards to flow through `reward_reveals` (auto-create a reveal row with `name=NULL`), OR
- Extend the on-completion hook to write `earned_prizes` rows for `task_rewards.reward_type IN ('custom', 'privilege')` directly.

Either way, every custom/privilege award lands in PrizeBox / merged page §9. This is a defect fix, not a feature add.

**B. Privilege delivery queue for mom.** Add a "Promised, Not Yet Delivered" section to mom's view of `/earnings`. Pulls `earned_prizes WHERE redeemed_at IS NULL AND prize_type IN ('text', 'image', 'platform_image')`. Action: "Mark Delivered" → sets redeemed_at + redeemed_by. This closes the §3 compliance gap (Subagent D bug #3, Subagent F section 9).

---

## §7 — BUGS SURFACED DURING RECON

File-and-forget per recon contract. Not fixed.

| # | Severity | Source | Description |
|---|---|---|---|
| 1 | Medium | Subagent A item 7.1 | `accrue-loan-interest` Edge Function not implemented — pg_cron job scheduled (migration 100134:944-954) but Edge Function code not built. Loan interest will not accrue today. |
| 2 | Low-Medium | Subagent A item 7.4 | Grace day mode parsing in `calculate-allowance-period/index.ts:215-217` casts JSONB as `unknown[]` — RPC handles both shapes (`string[]` legacy, `{date, mode}[]` new) but Edge Function is loosely typed. |
| 3 | Low | Subagent A item 7.5 | `numerator_keep` grace-day mode (NEW-TT) is wired in RPC + hooks but no visible UI in GraceDaysManager confirmed in scope. |
| 4 | Medium | Subagent B bug | `useUncompleteTask` calls `reverse_opportunity_earning` RPC fire-and-forget; result not surfaced to UI. If reversal fails (network, RLS), kid sees task uncompleted but money stays credited. Not blocking, but silent. |
| 5 | Medium | Subagent B bug | Cooldown calculation in `useOpportunityLists.ts:131-133` — `cooldownCutoff` becomes NaN when `cooldown_hours` is null. No fallback. Repeatable items without cooldown_hours allow unlimited re-claims. |
| 6 | Low | Subagent B bug | `is_available` race condition on list_items in `useCompleteOpportunityTask` lines 310-338 — read-then-write without atomic update. Two simultaneous completions can desync. |
| 7 | Low | Subagent B bug | `task_claims.member_id` vs `claimed_by` ambiguity — both columns exist post-backfill (migration 100023:430-431). Code could fail if one is null and the other expected. |
| 8 | Low | Subagent C bug #4 | Streak grace logic — `streak_grace_used_today` column exists, config has `streak_grace_days`, but RPC may not fully consume the grace check. Comments reference, code may be incomplete. Streaks may reset when grace should apply. |
| 9 | Medium | Subagent D bug #2 | `gamification_level` field exists, `level_thresholds` config exists, **no code increments the level anywhere**. Stub. If future feature references it, will return default 1. |
| 10 | Medium | Subagent D bug #3 / Subagent F section 9 | **Compliance gap**: privilege rewards captured but no delivery queue, audit trail, or "outstanding privileges" mom UI. Promises made and forgotten. |
| 11 | Medium | §4.4 (Subagent F section 4) | **Custom Reward double-path defect**: inline `task_rewards.reward_type='custom'` does NOT write `earned_prizes` row. Only `reward_reveals` path does. Mom sets custom reward expecting tracking, gets none. |
| 12 | Medium | Subagent E bug #1 | `PageUnlockRevealModal` referenced in modal queue (Convention #204) but no component built. Page unlocks fire silently; kid sees no visual feedback. |
| 13 | Medium | Subagent E bug #2 | `reward_reveals` + `reward_reveal_attachments` infrastructure orphaned — tables RLS'd, schema complete, context provider exists, modal exists. **No settings UI to create reveals; no completion hook to trigger them. 0 rows in production.** Essential-tier feature built but inaccessible. |
| 14 | Low | Subagent E bug #3 | `door_open` reveal seeded in migration 100142 with `css_component='DoorOpenReveal'`, but `DoorOpenReveal.tsx` does not exist in codebase. If reveal triggers, will fail silently. No consumer today. |
| 15 | Low | Subagent E bug #4 | `MemberColoringReveal` schema has 8 earning-related fields (earning_mode, threshold, counter, segment_ids, tracker_widget_id, tracker_threshold...) but Convention #212 says "4 fields only." Documentation drift; not a functional bug but confuses redesign work. |

---

## §8 — RECON-DRIVEN FOLLOW-UP TRIAGE ROW PROPOSALS

Worker proposes; orchestrator + founder decide before filing.

| Proposed | Surface | Severity | Reason | Existing scope |
|---|---|---|---|---|
| **NEW-ZZ** | Loan interest Edge Function build | Medium | Cron job exists, function doesn't. Loans+interest is core PRD-28; partial ship is misleading | Dependent on PRD-28 completion |
| **NEW-AAA** | Custom Reward double-path fix | Medium | Defect: mom sets custom reward inline, no PrizeBox row created | Independent; small fix |
| **NEW-BBB** | Privilege delivery queue for mom | Medium | §3 + Subagent F section 9 — compliance gap. Mom needs a "promised but not delivered" surface | Could fold into merged Earnings page (Mom shell) |
| **NEW-CCC** | gamification_level stub or remove | Low-Medium | Field + config exist with no code path. Either build progression or remove | Subagent D bug #2 |
| **NEW-DDD** | Streak grace logic audit | Low-Medium | `streak_grace_used_today` may not be fully consumed by RPC. Verify + fix | Subagent C bug #4 |
| **NEW-EEE** | reward_reveals settings UI + completion hook | Medium | Subagent E bug #2 — infrastructure orphaned. Could fold into NEW-AA or stand alone | Bundles with NEW-AA |
| **NEW-FFF** | Cooldown_hours null guard on opportunity items | Low | Subagent B bug #5 — defensive default needed | Independent small fix |
| **NEW-GGG** | DoorOpenReveal.tsx build OR remove from seed | Low | Subagent E bug #3 — seeded reveal type with no component | Trivial |
| **NEW-HHH** | Coloring reveal schema vs Convention #212 doc reconciliation | Low | Subagent E bug #4 — drift. Either prune extra fields or update convention | Documentation work |
| **NEW-III** | Merged `/earnings` page (the big one) | High | Founder addendum 2026-04-25 — this is the recommended next worker scope per §9 | Meta-row |

Existing rows that this recon SHOULD AMEND:

- **NEW-XX** — already filed for tracker money-source breakdown. Recommend amending to clarify "this is the snapshot view; the full breakdown lives on /earnings page" once §6 mental model lands.
- **NEW-WW** — already filed for per-line-item reward picker. Recommend amending to add "/earnings page Reward Setup section (mom-only)" as third surface for the shared cascade component.
- **NEW-AA** — already filed for reveal universal wrapper. Recommend amending to clarify scope includes resolving the `reward_reveals` orphaned-infrastructure problem (NEW-EEE could fold here).
- **NEW-QQ + NEW-YY** — already filed for points-as-primitive. Recommend Phase 0/1/2 staging per §6.3.

---

## §9 — RECOMMENDED NEXT WORKER SCOPE

Given the founder's design call and what this recon found:

### Recommended next build — single worker, single PR

**WORKER NAME:** EARNINGS-PAGE
**SCOPE:** Build the merged `/earnings` page with all 10 sections (per §5.3) for **Mom + Adult shells first**, plus the snapshot widget refactor.

**Rationale for single worker:**

- This is one cohesive build: one route, one page, one set of section components, one sidebar registration.
- The data already exists — every section reads from existing tables. No new schema (beyond optional Promised-Rewards consolidation per §6.6).
- Splitting into per-section workers would create coordination overhead with no real isolation benefit.
- Per-shell variants (Independent / Guided / Play) can be **a follow-up worker** after Mom/Adult ships — same pattern as Build N (PRD-18 Phase D teen rhythm) which forked teen variants after adult variants stabilized. Don't fork prematurely.

**First-build deliverables (single PR):**

1. New route `/earnings` registered in `App.tsx` + `getSidebarSections()` (Convention #16: Sidebar.tsx only, never BottomNav directly).
2. New page component `src/pages/EarningsPage.tsx` with section components for §1-10.
3. Per-shell rendering:
   - Mom shell: full page + family-level rollup
   - Adult shell: full page minus family-level
   - Independent / Guided / Play shells: temporary "Coming Soon" placeholder routing to existing surfaces (PrizeBox / AllowanceCalculatorTracker) until follow-up ships
4. Snapshot widget: refactor AllowanceCalculatorTracker to be a snapshot variant + tap-to-navigate to `/earnings`.
5. PlayRewards page (`/rewards`) updated to redirect → `/earnings` (Play variant deferred to follow-up).
6. Folder section §9: extend `earned_prizes` write path to include `task_rewards.reward_type IN ('custom', 'privilege')` (closes NEW-AAA defect; small piggyback).
7. Verification table per `claude/PRE_BUILD_PROCESS.md`: every section + Wired/Stubbed/Missing status. Mobile parity check at 375px.

**Deferred to follow-up workers:**

- **EARNINGS-PAGE-KIDS** worker: Independent / Guided / Play shell variants + Play visual reordering + reduced text per §5.3.
- **EARNINGS-REWARD-SETUP** worker: Mom's "Reward Setup" section (§6.5) — the shared cascade component from NEW-WW. Sequence after NEW-WW lands or fold into it.
- **EARNINGS-INTEGRATION-AA** worker: After NEW-AA universal reveal wrappers land, plug the reveal-wrapper picker into the Earnings page's Reward Setup section.
- **EARNINGS-POINTS-Q0** worker: After NEW-QQ Phase 0 rename lands, propagate vocabulary across the Earnings page.

**Scope guardrails for the first worker:**

- Do NOT bundle NEW-QQ flagship rename — that's its own worker.
- Do NOT bundle NEW-AA reveal wrapper unification — that's its own worker.
- Do NOT bundle NEW-WW per-line-item reward picker — that's its own worker.
- Do NOT bundle the privilege delivery queue completion — close NEW-AAA defect (small) but leave NEW-BBB queue as a follow-up section.
- DO close §6.6.A (Custom Reward double-path) as a piggyback because it's a 1-line write extension that unblocks §9 of the page from showing all custom rewards.

**Estimated build size:** 4-7 days for a focused worker. Mostly UI assembly + routing; minimal SQL.

**Sequencing recommendation:**
1. EARNINGS-PAGE (Mom + Adult, this recon's recommendation) — ships first
2. NEW-WW per-line-item reward picker — independent, can run in parallel
3. NEW-AA universal reveal wrappers — sequenced after #1+#2 stabilize
4. EARNINGS-PAGE-KIDS (per-shell variants) — sequenced after #1
5. NEW-QQ points flagship Phase 0/1/2 — sequenced last (largest scope)

---

## APPENDIX — SOURCE TRACE

| Section | Primary subagent | Secondary input |
|---|---|---|
| §1 Executive Summary | Synthesized from all 6 | Founder addendum |
| §2 Five Earning Streams | A (allowance), B (opportunity), C (gamification), E (reveals) | Migrations 100115, 100126, 100134, 100170-100175 |
| §3 Reward Currencies | D (currencies) | B + E for cross-references |
| §4 Overlap Map | All 6 | TRIAGE_WORKSHEET row context (NEW-AA, NEW-NN, NEW-HH, NEW-WW, NEW-XX, NEW-QQ, NEW-YY) |
| §5 Kid-Facing Surfaces | F (kid UI) | Founder addendum 2026-04-25 |
| §6 Unified Mental Model | All 6 | Composition Architecture §1.3 |
| §7 Bugs | A, B, C, D, E, F | All flagged file-and-forget |
| §8 Triage proposals | Worker synthesis | Existing row context |
| §9 Next worker scope | Worker synthesis | Founder addendum |

**Subagent IDs (for traceability):**
- A allowance: afaf350963ad4cf2d
- B opportunity: a79107a5817ed00ec
- C gamification: a0a13c486e0c35fbb
- D currencies: abf0f40879663edd1
- E reveals: ad46ac4e26f2e6d97
- F kid-facing UI: a18112869a40564be

— end of report —
