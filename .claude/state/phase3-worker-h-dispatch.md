# Phase 3 — Worker H Dispatch Prompt (Paste-Ready)

> Paste this into a fresh Claude Code session.
> This worker ships 3 things: creature_godmother, page_unlock_godmother, and Prize Board expansion to show allowance owed.

---

## Context Briefing

You are Worker H for Phase 3 of the Connector Architecture build for MyAIM Family. You're fixing a gap and adding a feature:

**Gap:** The old `roll_creature_for_completion` RPC was deleted (Worker F), but creature rolls and page unlocks were never rebuilt as independent godmothers. Kids currently earn points on task completion but do NOT earn creatures or page unlocks. This needs to be fixed.

**Feature:** The Prize Board (`/prize-board`) currently only shows unredeemed prize IOUs. Mom also needs to see allowance she owes her kids — potentially multiple weeks of unpaid allowance — with an itemized breakdown showing how/when each amount was earned.

**What already exists:**
- 10 godmothers fully wired via `execute_<godmother_type>` auto-registration
- `dispatch_godmothers` trigger fires on every `deed_firings` INSERT
- `member_creature_collection` table (stores earned creatures)
- `member_page_unlocks` table (stores unlocked sticker pages)
- `member_sticker_book_state` table (per-kid config: active theme, rarity weights, page unlock interval, creature earning mode)
- `gamification_creatures` table (161 creatures with rarity)
- `gamification_sticker_pages` table (26 pages)
- `allowance_periods` table (stores calculated periods with `total_earned`, `status`)
- `financial_transactions` table (append-only ledger)
- Prize Board at `/prize-board` (currently shows `earned_prizes` only)
- `points_godmother_configs` table (has columns for creature roll config)
- 14/14 Playwright tests green for the connector layer

---

## Required Reading

1. `claude/PRE_BUILD_PROCESS.md` — **MANDATORY.**
2. `claude/live_schema.md` — Check `member_creature_collection`, `member_page_unlocks`, `member_sticker_book_state`, `gamification_creatures`, `gamification_sticker_pages`, `allowance_periods`, `financial_transactions`.
3. `src/pages/PrizeBoard.tsx` — Current prize board you're expanding.
4. `supabase/migrations/00000000100210*` — points_godmother (your peer pattern).
5. `.claude/rules/current-builds/phase-3-connector-worker-ab.md` — Worker A+B context.

---

## Part 1: creature_godmother (new godmother)

**What it does:** When a deed fires and a contract routes here, roll for a creature. If the roll succeeds, award the creature to the kid's collection.

**The old logic (from the deleted `roll_creature_for_completion` Step 7):**
1. Check `member_sticker_book_state.is_enabled` for the kid — if disabled, no-op
2. Roll d100 against `creature_roll_chance_per_task` (default was a percentage)
3. If roll succeeds: pick a creature from `gamification_creatures` using `rarity_weights` JSONB on `member_sticker_book_state`
4. Insert into `member_creature_collection` with position on the active sticker page
5. Increment `member_sticker_book_state.creatures_earned_total`

**What to build:**

1. **RPC:** `execute_creature_godmother(contract_id UUID, deed_firing JSONB, payload JSONB, stroke_of TEXT)`
   - Read `member_sticker_book_state` for the kid (`deed_firing ->> 'family_member_id'`)
   - If `is_enabled = false` → return `{status: 'no_op', metadata: {reason: 'sticker_book_disabled'}}`
   - Determine roll chance: use `payload ->> 'payload_amount'` as roll percentage (0-100), OR read from `points_godmother_configs` if `godmother_config_id` is set, OR fall back to `creature_roll_chance_per_task` on the sticker book state
   - Roll: `random() * 100 < roll_chance`
   - If roll fails → return `{status: 'no_op', metadata: {reason: 'roll_failed', roll_chance}}`
   - If roll succeeds:
     - Pick creature: weighted random from `gamification_creatures` WHERE `theme_id = active_theme_id` AND `is_active = true`, weighted by rarity_weights
     - Find position on active page (next empty slot or random placement)
     - INSERT into `member_creature_collection`
     - UPDATE `member_sticker_book_state` SET `creatures_earned_total = creatures_earned_total + 1`
   - Return `{status: 'granted', grant_reference: member_creature_collection.id, metadata: {creature_name, creature_slug, rarity}}`

2. **Idempotency:** Use the `contract_grant_log` UNIQUE on (deed_firing_id, contract_id) — same as all other godmothers. The dispatch handles this before calling you.

3. **Migration:** Add `'creature_godmother'` to the `contracts.godmother_type` CHECK constraint.

---

## Part 2: page_unlock_godmother (new godmother)

**What it does:** When a deed fires and a contract routes here, unlock the next sticker page for the kid.

**The old logic (from deleted `roll_creature_for_completion` Step 8):**
1. Check if `creatures_earned_total` has reached the next `page_unlock_interval` threshold
2. If threshold met: find next locked page, insert into `member_page_unlocks`
3. Increment `member_sticker_book_state.pages_unlocked_total`

**What to build:**

1. **RPC:** `execute_page_unlock_godmother(contract_id UUID, deed_firing JSONB, payload JSONB, stroke_of TEXT)`
   - Read `member_sticker_book_state` for the kid
   - If `is_enabled = false` → return `{status: 'no_op', metadata: {reason: 'sticker_book_disabled'}}`
   - Determine unlock condition: 
     - If `payload ->> 'payload_config'` has `unlock_mode = 'every_n_creatures'`: check if `creatures_earned_total` modulo N = 0
     - If `unlock_mode = 'immediate'`: always unlock (for milestone rewards)
     - Default: use `page_unlock_interval` from sticker book state
   - If condition NOT met → return `{status: 'no_op', metadata: {reason: 'threshold_not_reached'}}`
   - If condition met:
     - Find next locked page: `gamification_sticker_pages` WHERE `theme_id = active_theme_id` AND `id NOT IN (SELECT sticker_page_id FROM member_page_unlocks WHERE family_member_id = kid)` ORDER BY `sort_order` LIMIT 1
     - If no pages left → return `{status: 'no_op', metadata: {reason: 'all_pages_unlocked'}}`
     - INSERT into `member_page_unlocks`
     - UPDATE `member_sticker_book_state` SET `pages_unlocked_total = pages_unlocked_total + 1`
   - Return `{status: 'granted', grant_reference: member_page_unlocks.id, metadata: {page_name, page_slug}}`

2. **Migration:** Add `'page_unlock_godmother'` to the `contracts.godmother_type` CHECK constraint (same ALTER as creature_godmother — combine into one).

---

## Part 3: Seed contracts for creature + page unlock

After creating the godmothers, seed contracts so kids with sticker books enabled automatically earn creatures on task completion (restoring the behavior that was lost when `roll_creature_for_completion` was deleted):

For each `member_sticker_book_state` row where `is_enabled = true`:
- Create a `creature_godmother` contract: `source_type='task_completion'`, `family_member_id=kid`, `if_pattern='every_time'`, `stroke_of='immediate'`, `inheritance_level='kid_override'`
- Create a `page_unlock_godmother` contract: `source_type='task_completion'`, `family_member_id=kid`, `if_pattern='every_time'`, `stroke_of='immediate'`, `inheritance_level='kid_override'` (the godmother itself checks the threshold)

---

## Part 4: Prize Board Expansion — "What I Owe My Kids"

**What to build:** Expand `/prize-board` to show mom everything she owes her kids in one place.

**Three sections on the Prize Board:**

### Section 1: Allowance Owed (NEW)
- Query `allowance_periods` WHERE `status = 'calculated'` (period closed, amount determined) AND no matching `financial_transactions` row with `transaction_type = 'payment_made'` exists for that period
- Also include the CURRENT open period's running total (call `calculate_allowance_progress` RPC for each kid with allowance enabled to get their current `total_earned` so far this week)
- Display per kid (member color header):
  - Kid name + total owed (sum of all unpaid periods)
  - Each unpaid period as a row: "Week of May 4-10: $12.50" 
  - Click/tap a period row → expand to show itemized breakdown:
    - Tasks completed that counted toward allowance (from `task_completions` joined with `tasks` for that period's date range)
    - Completion percentage, base amount, bonus if any
    - This comes from `allowance_periods.calculation_details` JSONB (which stores the full breakdown at period close)
  - "Mark Paid" button per period → inserts `financial_transactions` row with `transaction_type='payment_made'`, negative amount (debit from mom's perspective), and `source_reference_id = allowance_period.id`
  - "Pay All" button per kid → marks all outstanding periods as paid in one action

### Section 2: Prize IOUs (existing — keep as-is)
- Unredeemed `earned_prizes` grouped by kid
- "Mark Redeemed" button

### Section 3: Opportunity Earnings (NEW)
- Query `financial_transactions` WHERE `transaction_type = 'opportunity_earned'` OR `transaction_type = 'contract_grant'` AND no matching payout exists
- Actually — opportunity earnings are already deposited to balance. This section might not be needed. Check: does `awardOpportunityEarning` / `money_godmother` deposit directly to balance (making it immediately "owed")? If yes, this section = "Unpaid balance" which is just `calculate_running_balance(kid)` for each kid with a positive balance.
- Simplest version: Show each kid's current balance. If balance > 0, mom owes them money. "Mark Paid $X" button inserts a `payment_made` transaction that zeros the balance.
- Click balance → expand to show recent `financial_transactions` for that kid (last 20, most recent first)

### Layout:
- Tabs at top: "Allowance" | "Prizes" | "Balance"
- Or: single scrollable page with all three sections, each collapsible
- Your call based on how much content there is — tabs if each section gets long, single page if concise

### UI Notes:
- Mom-only (MomShell)
- Member color headers for each kid
- Amounts formatted as currency ($X.XX)
- "Mark Paid" / "Pay All" buttons use btn-primary styling
- Itemized breakdown uses density-compact card list
- Empty states: "All caught up! No allowance owed." / "No prizes to deliver." / "All balances at $0."
- Mobile: stacks vertically, tabs become a horizontal scroll pill bar

---

## Constraints

- **DO NOT modify BookShelf files.**
- **DO NOT modify existing godmother implementations** (Workers C+D).
- **DO NOT modify `dispatch_godmothers`** — your godmothers auto-register via naming convention.
- **Follow the `execute_<godmother_type>` naming convention.**
- **Run `tsc -b` after every commit.** Zero errors.
- **Test:** After building creature + page_unlock godmothers, verify manually that the pipeline works: insert a test deed_firing, confirm creature_collection gets a row.

---

## Migration Numbering

Current highest: `00000000100224`

**Your migrations start at: `00000000100225`**

Suggested:
- 100225 — creature_godmother + page_unlock_godmother RPCs + CHECK constraint update + seed contracts
- (code-only) — Prize Board expansion (React/TypeScript, no schema changes needed — reads existing tables)

---

## Output Format

After each commit, report:
1. Files created/modified
2. What was built
3. `tsc -b` result

After all commits, produce a summary of:
- What godmothers were added
- What contracts were seeded
- What the Prize Board now shows
- Any manual verification you ran
