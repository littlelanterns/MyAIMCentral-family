# PRD-24 Point Economy Addendum — Earning Configuration & The Reward Shop

**Status:** Draft — awaiting founder decision batch (D-PECON-1 … D-PECON-8) + scope confirmation on the 2026-07-07 riders (§1.1)
**Created:** 2026-07-07 (Fable design session, founder direct ask); riders folded same day
**Parent PRD:** PRD-24 (Gamification System — Overview & Foundation, March 2026)
**Supersedes within PRD-24 scope:** the "Gamification Event Pipeline" monolith, `gamification_events`, `gamification_rewards`, `reward_redemptions` (all March designs superseded by the built Phase-3 Connector + KIDS-REWARDS `earned_prizes` reality — see §2)
**Companion build pack:** `claude/dispatch-factory/PECON.md` (supersedes `RSTP.md`)
**Newer-wins chain:** this addendum > PRD-24 (Convention #11). Where this addendum is silent, PRD-24 still speaks.

---

## 1. Why This Addendum

Founder requirements (2026-07-07, near-verbatim):

1. *"Mom chooses how many points a kid gets for best intentions, tasks, etc."*
2. *"I'd like to give them points for each step in their schoolwork routine, but only one point for their morning grooming routine, even though it has several steps."* — per-ROUTINE reward mode: per-step / per-completion / none, plus amounts, mom's choice per routine.
3. A mom **store** where kids purchase rewards or privileges with points.
4. Founder idea to rule on: "percentage of completion" as a factor — ruled here as an unlock **gate** on shop items, never a spendable balance (§7.6).

These are one system in mom's mental model — *"I set what things earn, and what things cost"* — and are designed here as one. PRD-24 (March 2026) designed this system before the Phase-3 Connector, KIDS-REWARDS, FAMILY-GOALS-PRIZES, and Convention #271 existed. This addendum reconciles the March design against the July platform and specifies exactly what gets built.

### 1.1 Founder riders (2026-07-07, added before Worker A dispatch — the buffet use case)

A points-first family runs a buffet: different tasks worth different points, the kid chooses freely, and a daily target frames the day. **Points remain a neutral composable primitive — some families ignore them entirely, some run their whole economy on them.** Four riders, folded throughout this addendum:

1. **Per-task point values** — an individual task can override the per-kid default ("this task is worth 5"), surfaced in the task editor's Rewards & Completion Tracking section. Ruling on `tasks.points_override` after live verification: **REUSED, not replaced** — the column is already written by four live paths (opportunity claims `useOpportunityLists.ts:209`, sequential collections `useSequentialCollections.ts:236/530`, randomizer-spinner draws `RandomizerSpinnerTracker.tsx:148`, all via `resolveRewardProperties`) but read by nothing. Wiring it into the award path is honesty repair #5 (§3). See §5.1.
2. **Daily points goal (optional, per kid)** — "10 points a day," warm progress on the kid's dashboard and My Rewards ("7/10 today"); hitting it can fire rewards through the existing contracts engine; missing it NEVER deducts, punishes, or renders a shame state; families that don't enable it see nothing. See §5.7.
3. **Shared routines, per-step mode — attribution PINNED:** each step's points go to the ACTUAL completer (`routine_step_completions.member_id`), never the assignee list. Kid A does four steps of a shared routine → kid A gets four steps' points. Same attribution rule allowance already uses. Already the §5.3 ruling — now carried as a named E2E pin, not just design text.
4. **Three independent rails — PINNED:** `counts_for_allowance` and `counts_for_gamification` stay independent switches. A shared routine flagged allowance-extra-credit (numerator-only) must keep working exactly as today alongside points. Named E2E pin: an extra-credit shared routine step completed by kid A (a) boosts A's allowance numerator, (b) adds NOTHING to any kid's denominator, (c) pays A the step's points when per-step mode is on. If points work ever breaks numerator-only behavior, the pin fails. See §10.

---

## 2. Reconciliation — PRD-24 (March) vs. Built Reality (July)

Every conflict named, newer/built wins:

| PRD-24 (March) concept | Built reality (verified 2026-07-07) | Ruling |
|---|---|---|
| 10-step "Gamification Event Pipeline" monolith fired on task completion | Phase-3 Connector: `fireDeed` → `deed_firings` → `dispatch_godmothers` → godmothers (migrations 100199–100225). `roll_creature_for_completion` dropped (100221). | **Connector is the engine.** No monolith is ever built. Point awards for member-level sources ride contracts + `points_godmother`; routine-step awards use the direct-RPC pattern (like `award_custom_reward_for_completion` — also not deed-routed). |
| `gamification_events` append-only ledger | Never built. `gamification_points` is a bare integer (`00000000000001:70`); only audit trail is `contract_grant_log` (deed-keyed, no spend side). | **Superseded by `point_transactions`** (§8.1) — narrower, #223-shaped, both earn and spend. `gamification_events` is never built under that name. |
| `gamification_rewards` + `reward_redemptions` (per-child reward menu, redeem flow) | KIDS-REWARDS built `earned_prizes` (100144/100266/100284) with visibility model, redeem/un-redeem, Prize Board, My Rewards, `reward_proposals`. | **Superseded by `reward_shop_items` + `reward_shop_purchases`** (§8.2–8.3) feeding the existing `earned_prizes` pipe. `gamification_rewards`/`reward_redemptions` are never built under those names. |
| Reward approval rides PRD-15 `requests.request_type='reward_redemption'` | `family_requests` has no `request_type` and no payload column — which is exactly why `reward_proposals` was built as its own table rendered inside the Queue Requests tab (100278:6). | **Purchases follow the proposals precedent:** own table (`reward_shop_purchases`), own card in `RequestsTab`, one-inbox rule preserved at the UI layer. |
| `routine_points_mode` per-KID on `gamification_configs` ('per_step'/'on_completion') | Column exists, **read by nothing** (only the TS interface declares it). Founder's requirement is per-ROUTINE, not per-kid. | **Retired in place** (registered dormant). Superseded by template-level `routine_points_mode` (§5.2). |
| `bonus_at_three`/`bonus_at_five` daily bonuses | Columns exist, read by nothing at runtime. | **Stay dormant, registered.** Daily-bonus economics return later as a contract pattern (`above_daily_floor` IF pattern already exists), not hardcoded pipeline steps. |
| `tasks.points_override` per-task override | Column exists (live schema #14), never written by the TASK editor — but IS written by the opportunity/sequential/randomizer bridge-task paths via `resolveRewardProperties` (rider verification, §1.1). The task editor writes `task_rewards` rows (`reward_type` stars/points + amount) that nothing pays. Read by nothing either way. | **`points_override` REUSED as THE per-task point value** (rider 1): the task editor gains an explicit "Points for this task" field writing it (symmetry with `allowance_points`); the reward-type dropdown drops its dead `stars`/`points` options (existing `task_rewards` stars/points rows — 3 in production — backfilled into `points_override`); the award path reads it (§5.1). |
| Treasure boxes (4 trigger types, video reveals) | Unbuilt. Reveal machinery exists (`reveal_animations` live; `reward_reveals`/`reward_reveal_attachments` dormant; contract reveals via `contract_grant_log` + `ContractRevealWatcher`). | **Stub.** A future build composes shop catalog + reveal ceremony. A points-threshold treasure box ≈ a shop item with a reveal — natural v2. |
| Streak milestone bonuses, levels, achievements, leaderboard | `compute_streak` live (100204/100240); no bonus path; no levels/achievements/leaderboard. | **Out of scope here.** Registered stubs; streak bonuses return as a `streak` IF-pattern contract when wanted. |
| Points hierarchy "task override > member base > shell default" | Live award reads `contracts.payload_amount` — a one-time cutover snapshot (§3 defect 1). | **Restored as config-as-truth** (§5.1) — same architecture ruling TRKG already made for sticker-book modes (godmothers read config tables, not contract snapshots). |
| Allowance/money strictly separate from points (PRD-24 Decision 16) | Holds. Convention #223/#225 discipline. | **Unchanged.** The shop is priced in points only; dollars-as-shop-currency is a stub (§11). |

---

## 3. Live Defects Found by This Design Session (all ride the PECON build)

Recon (three parallel code agents + two read-only production queries, 2026-07-07) found four defects in the existing points pipeline. They are folded into the build because the new features would otherwise be built on sand:

1. **Dead-lever points config.** `GamificationSettingsModal` "Points per task" writes `gamification_configs.base_points_per_task`, but `execute_points_godmother` (100210:99-119) reads `contracts.payload_amount` — a one-time snapshot taken by the 100219 cutover seed. Editing the setting has changed nothing since Phase 3 shipped. Fix: §5.1 resolution order + a migration that NULLs `payload_amount` on standard contracts *only where it still equals the kid's current `base_points_per_task`* (never-diverged rule — a deliberately-edited contract keeps payload semantics).
2. **Provisioning gap.** Members whose gamification was enabled after the 100219 cutover have **no points contract at all** (`auto_provision_member_resources` seeds `gamification_configs` but no contracts) — they earn zero connector points. Fix: `ensure_point_economy_contracts()` + trigger on `gamification_configs` + backfill (§5.1).
3. **Intention deeds unmatched.** `useBestIntentions.ts:444-454` fires `intention_iteration` deeds; no points contract has ever matched them. Best-intention tallies earn nothing — exactly the founder's ask #1. Fix: standard intention contract + `intention_tally_points` config (§5.4).
4. **Section-DOW blindness (latent).** `daily`/`weekly` routine sections are stored with `frequency_days = NULL` (`serializeRoutineSectionsForRpc.ts:69-73`), but both `get_member_day_obligations` (100247:339) and `calculate_allowance_progress` (100247:591) match sections via `= ANY(tts.frequency_days)` — never true for NULL. Verified in production: 12 such sections exist, **all on undeployed seed/draft templates (zero active deployments, zero assignees)** — so nothing miscounts today, but the first `daily`-section routine mom deploys silently drops out of allowance denominators AND the new routine-completion event. Fix: semantic day-matching in both SQL sites mirroring the client reader exactly (`daily` → all days, `weekdays` → DOW 1–5, `custom` → array, `weekly`/`monthly` → match-all for client parity), invariant test corpus extended (§5.3).

Three honesty repairs ride along: (5) per-item point amounts moms configure on opportunity boards, sequential collections, and randomizer draws are written into `tasks.points_override` on the bridge task — **which nothing has ever paid**; §5.1's resolution order makes them pay. (6) `'stars'`/`'points'` reward types in Task Creation Section 7 write `task_rewards` rows nothing pays — backfilled into `points_override` and the dead dropdown options removed. (7) `src/lib/gamification/grantPoints.ts` (zero importers) is deleted.

---

## 4. The One Mental Model

> **Mom sets what things EARN and what things COST — from two doors that feel like one system.**

- **Earning** — per kid, in Gamification Settings ("Points" section, §7.1): points per task, points per best-intention tally, and a glance-list of routines with links. Per routine, in the routine editor's Rewards section (§7.2): per-step / whole-routine / none + amounts. Per task, in the existing Rewards section of the Task Creation Modal (unchanged UI, now actually paid).
- **Spending** — the **Reward Shop** (working name, D-PECON-4): mom stocks it from a new Prize Board tab (§7.3); kids browse and buy from a Shop section on My Rewards (§7.4), Play kids from a picture shelf (§7.5). Purchases become `earned_prizes` — so redemption, history, Prize Board, and the visibility model all work day one.
- **One balance, one ledger** — `family_members.gamification_points` stays the balance; every change (earn, spend, refund, adjustment) flows through one choke-point RPC into the append-only `point_transactions` ledger (§8.1).

Money (allowance/financial) remains fully separate. Sticker-book creature earning remains fully separate (orthogonal pipelines; both can fire from the same completion).

---

## 5. Part 1 — Earning Configuration

### 5.1 Config-as-truth point resolution (the repair + the foundation)

`execute_points_godmother` (rewritten from the CURRENT 100210 body) resolves the award amount:

1. `contract.payload_amount` **if NOT NULL** — custom/wizard-authored points contracts keep working exactly as today.
2. Else, by deed `source_type`:
   - **`task_completion`:** `tasks.points_override` if set (the per-task value — rider 1; already written by the opportunity/sequential/randomizer bridge paths, now also by the task editor's new "Points for this task" field) → else `gamification_configs.base_points_per_task`. Skips when `tasks.counts_for_gamification = false` (Convention #224). Skips `task_type='routine'` parent rows defensively (routine economics are §5.2's, and routine parents never complete anyway). Migration backfills the handful of existing `task_rewards` stars/points rows into `points_override` and the task editor's reward-type dropdown drops its dead `stars`/`points` options (the dropdown remains for money/privilege/custom prizes — points are not a "reward type," they're a value any task can carry).
   - **`intention_iteration`:** `gamification_configs.intention_tally_points` (NULL → no award).
3. Award goes through `record_point_transaction()` (§8.1) — the godmother no longer touches `gamification_points` directly.

**Per-task point value UX (rider 1):** the Rewards & Completion Tracking card gains a "Points for this task" number input, gated on `counts_for_gamification`, placeholder showing the assignee's default ("defaults to 10") — exact symmetry with the existing per-task `allowance_points` input. Multi-assignee tasks: one override value; each kid's award uses it verbatim (their own default applies only when the field is empty).

**Standard contracts.** One per-kid `every_time` contract per member-level source, stamped `source_category='point_economy'`, `payload_amount = NULL` (config-driven): `task_completion` (exists from the 100219 seed for cutover-era kids; payload NULLed by the never-diverged migration rule) and `intention_iteration` (created when mom sets an intention value). `ensure_point_economy_contracts(p_member_id)` creates missing standard contracts idempotently; invoked by a trigger on `gamification_configs` (INSERT, UPDATE OF `enabled`/`intention_tally_points`) and a one-time backfill for every currently-enabled member. Mom's `/contracts` page remains the power-user view of the same rows; the friendly surface never creates duplicates (identified by `source_category`).

**Why config-as-truth:** it is the same ruling TRKG already made for creature/page earning modes — godmothers read config tables as the source of truth; contract payloads are for custom rules. It fixes defect 1 at the root instead of adding a sync layer.

### 5.2 Per-routine reward mode (the founder headline)

Three new columns on `task_templates` (routine templates only; live-propagating to every deployment per Convention #259, exactly like section/step structure):

| Column | Type | Meaning |
|---|---|---|
| `routine_points_mode` | TEXT NOT NULL DEFAULT `'none'` CHECK (`'none'`,`'per_step'`,`'per_completion'`) | What this routine's points economy is |
| `routine_step_points` | INTEGER NULL | Points per step check-off (per_step mode) |
| `routine_completion_points` | INTEGER NULL | Points when everything scheduled today is done (per_completion mode) |

- **Default `'none'`** — routines earn nothing today (verified: step completions fire zero pipeline), so nothing changes until mom opts a routine in. No surprise inflation, no retroactive change.
- **Template-level, not per-deployment.** Deployments of the same template share one economy (the founder's examples — schoolwork vs. grooming — are different templates). A mom who wants different values per kid duplicates the template (existing deep-clone flow). Per-deployment override is a registered stub.
- The founder's exact scenario: schoolwork routine → `per_step`, `routine_step_points = 1` (a point every step); morning grooming → `per_completion`, `routine_completion_points = 1` (one point for the whole thing, however many steps).
- Master-template edits propagate live with the existing `MasterTemplateEditConfirmationModal` flow (#259); past awards are never recalculated.
- Retired: `gamification_configs.routine_points_mode` (per-kid, never read) — registered dormant, superseded by this.

**Per-step points override:** a step carrying an explicit `'stars'` step reward (§5.5) replaces `routine_step_points` for that step only. Pacing tool, not pressure tool.

### 5.3 The routine-completion event (Convention #271 / #278 Rider-2 compliant)

"Did the kid finish everything scheduled today for this routine?" is an **assigned-denominator question** and MUST route through `get_member_day_obligations` — never derived inline. Specification:

- **Firing point:** `process_routine_step_completion(p_completion_id)` — one SECURITY DEFINER RPC called never-throws from `useCompleteRoutineStep` after the upsert (additive per #199: a failed award never blocks the checkmark). This is the single payout point for §5.2 per-step points, §5.3 completion points, and §5.5 step prizes — one client call, one round trip.
- **per_step award:** `routine_step_points` to `routine_step_completions.member_id` (the actual instance completer — #202/#267 parity), per instance. Idempotency key `rsp:{step_id}:{member_id}:{period_date}:{instance_number}` — same-day recheck never double-awards; **uncheck never revokes** (#219).
- **per_completion evaluation:** required set = `get_member_day_obligations(member, period_date, period_date)` filtered to this `task_id` (`source_type='routine_step'`), expanded by `instance_count`; done set = that day's `routine_step_completions` for the task (any completer counts on shared steps — dashboard-truth parity with #266). When done ≥ required → award `routine_completion_points`, key `rcp:{task_id}:{member_id}:{period_date}`.
- **Shared routines:** the completion award goes to **every assignee who completed at least one step that day** (contribution-based; never a free-rider award, never a shame withhold). Non-shared: the assignee.
- **Carry-over:** `show_until_complete` steps completed late attribute to the scheduled day (100245 walk-back) — completing yesterday's last step today fires yesterday's completion award. Correct and celebration-only.
- **Precondition (defect 4 fix):** semantic section-day matching lands in `get_member_day_obligations` AND `calculate_allowance_progress` first — `frequency_rule='daily'` (NULL days) matches every day, `'weekdays'` matches DOW 1–5, `'custom'` matches the array, `'weekly'`/`'monthly'` match-all (client-reader parity; the client's fall-through renders them daily). `tests/routine-day-state-invariant.test.ts` corpus extends to pin it.

### 5.4 Best-intention tally points

- New `gamification_configs.intention_tally_points INTEGER NULL` (NULL = off, the current behavior). One value per kid (D-PECON-3); per-intention overrides are a registered stub.
- When set, the standard `intention_iteration` contract exists (§5.1) and every personal tally awards that many points via the connector (deed already fires today — defect 3).
- Family Best Intentions tallies (`family_intention_iterations`) deliberately do NOT award personal points — they feed Family Goals (#278). Registered as a future decision if wanted.

### 5.5 Per-step prize rewards (absorbed from the RSTP pack — rulings carried intact)

Founder-approved batch-7 rulings D-RSTP-1/2 carry unchanged into this build:

- Five additive columns on `task_template_steps`: `reward_type` (CHECK `'privilege'`,`'custom'`,`'money'`,`'stars'`), `reward_amount NUMERIC`, `reward_description`, `reward_image_url`, `reward_image_asset_key`. Live-propagating per #259.
- Paid inside `process_routine_step_completion`: privilege/custom → `earned_prizes` row with `source_type='routine_step'` (free-TEXT column, no migration needed); money → existing `grant_money` path; stars → `record_point_transaction` (acts as the per-step points override, §5.2).
- Immediate, idempotent per (step, member, period_date, instance), never revoked, no approval gate — mom controls exposure by choosing which steps carry rewards.
- Builder UI: per-step reward config in `RoutineSectionEditor` reusing the three-mode `RewardImagePicker`; serializer + `update_routine_template_atomic` extended (base on CURRENT bodies). Shared-step note: "any assignee who completes an instance earns this."
- `useRewardProvenance` gains `'routine_step'` and `'store_purchase'` (merge note with TRKG's `'widget'` — second lander merges).

### 5.6 Daily Points Goal (rider 2 — optional, per kid)

The buffet frame: different tasks worth different points, the kid chooses freely, and a daily target gives the day shape.

- **Config:** `gamification_configs.daily_points_goal INTEGER NULL` — NULL = off (the default; families that don't enable it see nothing anywhere). Set in the Gamification Settings Points section (§7.1).
- **Display:** warm progress — "7/10 today" — on the kid's My Rewards Points section (all shells, including the Play variant with minimal numbers) and on the dashboard points displays that already exist (PlayDashboard / GuidedDashboard points readouts). Progress = SUM of today's `'earn'` transactions only, at the family-local day (`families.timezone`, Convention #257 — a small `member_points_today(p_member_id)` RPC, never client day math). **Spending never subtracts progress** — buying something in the shop doesn't un-earn the day. Refunds and adjustments don't count as earning.
- **Hitting the goal:** `record_point_transaction()` fires a `daily_points_goal_met` deed exactly once per member per family-local day when an earn crosses the goal (`deed_firings.idempotency_key = 'dpg:{member}:{date}'`). The existing contracts engine takes it from there — mom can author "when [kid] hits their daily goal → [any godmother: custom reward, money, points bonus, prize]" via `/contracts` (source_type CHECK widened + `ContractForm` option added). v1 ships the deed + display; no auto-authored contracts. Crossing celebration: the standard micro-celebration class per shell, nothing more.
- **Missing the goal:** nothing. No deduction, no streak-of-misses, no red state, no "you didn't" copy — the progress display simply starts fresh tomorrow. Raising the goal mid-day after it already fired never un-fires it (#219).
- **Neutral primitive law (founder, verbatim intent):** points are a composable primitive — some families ignore them, some run their whole economy on them. Every point surface (values, goal, shop) renders only when its config is set; a family with gamification off sees zero point UI.

### 5.7 Celebration-only boundaries (earning side)

- Points are **never deducted as punishment**. The only negative transactions are voluntary spending, purchase refunds, and mom's explicit balance adjustments (Reset & Advanced) — all ledgered.
- Rate changes are never retroactive (PRD-24 edge case, upheld): existing balances stand; new values apply to future earnings.
- per_step vs. per_completion is about **pacing** — an incomplete per_completion day awards nothing and *says* nothing. No missed-day surface anywhere.
- Uncheck/unmark never claws back points (#219; consistent with the platform-wide #206 posture).

---

## 6. Part 2 — The Reward Shop (Spending)

### 6.1 Shape

- **Family-level catalog** (`reward_shop_items`): each item has a name, image (three-mode `RewardImagePicker`), point cost, per-item audience (member pills; empty = every gamification-enabled kid), per-item approval flag, optional purchase limit (N per day/week/month or lifetime), optional unlock gate (§6.4), active/archived state. Catalog items are **data, not code**.
- **One cost per item.** Point scales differ per kid (Play 1/task vs. Guided 10/task); the editor shows a gentle note when an item's audience spans kids with very different base rates. Per-member price overrides are a registered stub. Moms who keep uniform scales never see the issue.
- **Management:** mom + `reward_rules`-granted adults (same grant class as `/contracts`, Convention #274). **Approvals: mom only** (v1, parity with proposals).

### 6.2 Purchase lifecycle

```
Kid taps Buy → confirm modal
  → purchase_reward_shop_item() [SECURITY DEFINER]
      validates: item active · audience · limit window · unlock gate · balance
      deducts points NOW (spend transaction, row-locked, race-safe)
      inserts reward_shop_purchases row
  ├─ auto-approve item → status 'auto_approved'
  │     + earned_prizes row (source_type='store_purchase', snapshot of name/image)
  │     + quiet mom notification ("Casey got Movie Night — 200 points")
  └─ approval item → status 'pending'
        + mom notification → Queue Requests tab card (proposals precedent)
        kid sees "Waiting for mom — points set aside" + [Take it back]
            mom Approve → earned_prizes row + celebratory kid notification
            mom Decline → refund transaction + gentle kid notification (+optional note)
            kid cancel  → refund transaction
```

- **Deduct-at-purchase** (not at approval): race-safe — a kid can't double-spend one balance across two pending requests. The hold is honest in the ledger as spend + (maybe) refund.
- **`earned_prizes` only ever holds real granted prizes** — created at auto-approve or mom-approve, never in pending state. Consistent with #278 ("earned prizes are never revoked") and the 100266 visibility model (`visibility='family'`, `created_by = item.created_by`, prize name/image snapshotted from the item). Redemption ("we did it / it's used") = the existing redeem flow, Prize Box, history, un-redeem — zero new redemption machinery.
- **Play shell: every purchase requires mom approval** regardless of the item flag (recommended, D-PECON-4) — Play redemption is mom-assisted per PRD-24's role table.
- **Family-device sessions:** the purchase RPC accepts the member id and authorizes caller = that member's `user_id` OR a family-shadow session of the family (`util.is_family_shadow_of` — the FDWA lesson; `redeem_own_prize`'s missing shadow branch is not repeated here) OR mom acting-for (View-As / Play assist, `acted_by` attribution).

### 6.3 Queue integration

`reward_shop_purchases` renders as its own card type in the existing Queue `RequestsTab`, above/alongside proposals and requests — the one-inbox rule holds at the UI layer, exactly like `reward_proposals` (which was built as its own table for the same reason: `family_requests` has no payload column). Card: kid avatar + name, item image + name, cost, kid's balance after, [Approve] [Not this time + note]. No `family_requests` rows are created.

### 6.4 Completion-percentage unlock gates (founder idea — ruled)

**Ruling: a gate, never a currency.** Completion percentage is a *rate*; treating it as spendable would double-pay effort and break the points ledger. As a gate it answers "is this reward available this week?"

- `reward_shop_items.unlock_rule JSONB NULL` — v1 supports one rule type: `{"type": "completion_pct", "threshold": 80, "window": "week"}`.
- Evaluated by a new thin RPC `member_completion_percentage(p_member_id, p_start, p_end)` implementing the same two-part counting `calculate_allowance_progress` uses (routine days gated through `obligation_active_for_member_on_date`, non-routine tasks direct-counted — the documented #271 grandfathered blend), minus the money math and pool coupling. Consumed by the purchase RPC (hard check) and the shop UI (display).
- **Framing rules (non-negotiable):** a gated item shows warm progress — "Unlocks in 80%+ weeks — you're at 72% this week!" with a progress bar. It never lists what was missed, never names the gap, never appears as a punishment. A kid with zero assigned work sees the item ungated (0/0 = 100%, matching allowance semantics). An already-purchased item is never re-locked or revoked by a later bad week.

### 6.5 What the reveal ceremony does (v1)

Auto-approved and mom-approved purchases fire a client-side celebration (shell-appropriate: SparkleOverlay-class in Play, subtle elsewhere) + the prize card appearing in My Rewards. The full contract-reveal ceremony (`contract_grant_log` → `ContractRevealWatcher`) is NOT injected — purchases are not contract grants. A "treasure-box" ceremonial purchase reveal is the registered treasure-box stub's natural home.

---

## 7. Screens

### 7.1 Gamification Settings — "Points" section (mom, per kid)

`GamificationSettingsModal` (Convention #221's 6 sections → 7) gains a **Points** section replacing the lone "Points per task" field in Master Toggles:

- Points per task (existing field — now actually drives awards; individual tasks can override it right in the task editor)
- Points per Best Intention tally (new; empty = off)
- Daily points goal (new; empty = off — "a target like 10 points a day; [Name] sees warm progress, and you can attach a reward to hitting it from the Contracts page")
- "Routines set their points in each routine's editor" — glance list of this kid's active routines with their mode/amount and a jump-link to each editor
- Currency name/icon (existing fields, relocated here)
- [Manage the Reward Shop →] (family-level door, §7.3)

Same section mirrors into `GamificationSettingsPage`. This is the ONE per-kid points surface — nothing scattered.

### 7.2 Routine editor — Rewards section (mom)

`TaskCreationModal` routine mode, inside the existing "Rewards & Completion Tracking" SectionCard (`:2501`): a routine-only **Points** block —

```
Points for this routine
( ) None — this routine doesn't earn points
( ) Each step — [ 1 ] point(s) every time a step is checked off
( ) Whole routine — [ 1 ] point(s) when everything scheduled today is done
```

Plus the per-step prize picker inside `RoutineSectionEditor` (§5.5). Master-edit propagation copy handled by the existing #259 confirmation modal.

**Non-routine tasks** get the "Points for this task" override input in the same Rewards & Completion Tracking card (§5.1, rider 1) — gated on `counts_for_gamification`, placeholder showing the kid's default. The reward-type dropdown simplifies to prize types (none / money / privilege / custom).

**Kid dashboards + My Rewards Points section** gain the "7/10 today" daily-goal progress when `daily_points_goal` is set (§5.6) — warm, minimal, absent when unset.

### 7.3 Prize Board — "Shop" tab (mom + reward_rules-granted adults)

Fourth tab on `/prize-board` (Allowance · Prizes · Balance · **Shop**):

- Item list (image, name, cost, audience pills, approval badge, limit, gate badge, active toggle) with add/edit/archive
- Item editor modal: name, description, `RewardImagePicker`, cost, audience member pills, "Needs my approval" toggle (default ON), purchase limit (N per day/week/month/ever), unlock gate (threshold + week window), notes-to-kid
- **Bulk add with AI** (#252 — mandatory on any multi-item creation surface): mom pastes "movie night 200, extra screen time 50, ice cream 75, pick dinner 100" → parsed items with costs → HITM review → save
- Pending purchases strip with jump to Queue
- Purchase history (per kid filterable)

### 7.4 My Rewards — "Shop" section (kid: Guided / Independent / Adult)

New section (`my_rewards_sections.shop`, default ON where gamification enabled): balance header in the kid's own currency; item cards with image, name, cost chip, and one of three states — **Buy** (affordable), **progress bar** ("37 more!" — celebration-framing, never "can't afford"), or **gate progress** ("Unlocks in 80%+ weeks — you're at 72%"). Pending purchases show "Waiting for mom — points set aside" + [Take it back]. Purchased prizes land in the existing Prize Box section.

### 7.5 Play shell — picture shelf

Play variant of the Shop section: big image-forward tiles (56px+ targets), cost as star-count chips (minimal numbers per Play norms), tap → simple confirm ("Trade 5 ⭐→ [Lucide star icons] for this?" — icon library, no emoji) → always goes to mom for approval. No gate math shown — gated items simply don't render on Play.

### 7.6 Queue — purchase approval card

`StorePurchaseCard` in `RequestsTab` (§6.3).

---

## 8. Data Model

### 8.1 `point_transactions` (new — the ledger)

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| family_id | UUID NOT NULL FK | |
| family_member_id | UUID NOT NULL FK | |
| amount | INTEGER NOT NULL | + earn, − spend |
| balance_after | INTEGER NOT NULL | running balance (audit invariant: SUM(amount) = latest balance_after = `family_members.gamification_points`) |
| transaction_type | TEXT NOT NULL CHECK | `'earn'`,`'spend'`,`'refund'`,`'adjustment'` |
| source_type | TEXT NOT NULL | `'task_completion'`,`'intention_iteration'`,`'routine_step'`,`'routine_completion'`,`'step_reward'`,`'store_purchase'`,`'store_refund'`,`'manual_adjustment'`,`'opening_balance'`,`'contract_grant'`,… (free TEXT, same posture as `earned_prizes.source_type`) |
| source_id | UUID NULL | |
| description | TEXT NULL | "Completed: Clean bedroom" / "Bought: Movie Night" |
| idempotency_key | TEXT NULL UNIQUE | e.g. `rsp:{step}:{member}:{date}:{instance}` |
| acted_by | UUID NULL FK | attribution for mom-assisted / adjustments |
| created_at | TIMESTAMPTZ NOT NULL | |

**Append-only** (#223 discipline): INSERT via SECURITY DEFINER only — no client INSERT/UPDATE/DELETE policies. RLS SELECT: mom all within family; members own rows. Choke point `record_point_transaction(...)`: `SELECT … FOR UPDATE` on the `family_members` row → balance guard for spends → insert + balance update atomically → `ON CONFLICT (idempotency_key) DO NOTHING` returns `already_recorded`. `grant_points` retrofitted to delegate to it (godmother signature untouched); the Reset & Advanced balance reset routes through `'adjustment'` rows. Backfill: one `'opening_balance'` row per member at migration time.

### 8.2 `reward_shop_items` (new)

`id, family_id, created_by FK, name TEXT NOT NULL, description TEXT, image_url TEXT, image_asset_key TEXT, point_cost INTEGER NOT NULL CHECK (point_cost > 0), requires_approval BOOLEAN NOT NULL DEFAULT true, audience_member_ids UUID[] NOT NULL DEFAULT '{}', limit_per_member INTEGER NULL, limit_period TEXT NULL CHECK ('day','week','month'), unlock_rule JSONB NULL, notes_to_kid TEXT, sort_order INTEGER NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true, archived_at TIMESTAMPTZ, created_at, updated_at`

RLS: mom full CRUD; `reward_rules` family-wide-granted adults CRUD; members SELECT where `is_active AND archived_at IS NULL AND (audience_member_ids = '{}' OR member ∈ audience)`.

### 8.3 `reward_shop_purchases` (new)

`id, family_id, store_item_id FK, family_member_id FK NOT NULL, item_name TEXT NOT NULL (snapshot), points_cost INTEGER NOT NULL (snapshot), status TEXT NOT NULL CHECK ('pending','approved','declined','cancelled','auto_approved'), decline_note TEXT, processed_by UUID FK, processed_at TIMESTAMPTZ, spend_transaction_id UUID FK → point_transactions, refund_transaction_id UUID FK NULL, earned_prize_id UUID FK NULL → earned_prizes, acted_by UUID NULL, created_at, updated_at`

RLS: member reads own; mom reads/updates all; writes via the three SECURITY DEFINER RPCs only (`purchase_reward_shop_item`, `resolve_reward_shop_purchase`, `cancel_reward_shop_purchase`).

### 8.4 Column additions / changes to existing tables

| Table | Change |
|---|---|
| `task_templates` | + `routine_points_mode` TEXT NOT NULL DEFAULT 'none' CHECK, + `routine_step_points` INTEGER NULL, + `routine_completion_points` INTEGER NULL |
| `task_template_steps` | + `reward_type` TEXT NULL CHECK ('privilege','custom','money','stars'), + `reward_amount` NUMERIC NULL, + `reward_description` TEXT NULL, + `reward_image_url` TEXT NULL, + `reward_image_asset_key` TEXT NULL |
| `gamification_configs` | + `intention_tally_points` INTEGER NULL, + `daily_points_goal` INTEGER NULL. (`routine_points_mode`, `bonus_at_three`, `bonus_at_five` remain in place, registered dormant.) |
| `tasks` | `points_override` REUSED (rider 1): now written by the task editor's "Points for this task" field and READ by the award path; existing `task_rewards` stars/points rows backfilled into it |
| `contracts` | standard point-economy rows stamped `source_category='point_economy'`; never-diverged `payload_amount` snapshots NULLed by migration; `source_type` CHECK widened with `'daily_points_goal_met'` (+ `ContractForm` source option) |
| `family_members.preferences` | `my_rewards_sections.shop` toggle key (runtime JSONB, no schema change) |

Functions: `record_point_transaction` (now also fires the once-per-day `daily_points_goal_met` deed on goal crossing), `member_points_today`, `ensure_point_economy_contracts` (+ trigger), `process_routine_step_completion`, `purchase_reward_shop_item`, `resolve_reward_shop_purchase`, `cancel_reward_shop_purchase`, `member_completion_percentage`, rewritten `execute_points_godmother` (CURRENT 100210 body), semantic-day-match rewrites of `get_member_day_obligations` + `calculate_allowance_progress` (CURRENT 100247 bodies). Feature keys: `reward_shop` registered in `feature_key_registry` + `feature_access_v2` (beta bypass honored).

---

## 9. Visibility & Permissions

| Role | Earning config | Shop management | Buying | Purchase approval |
|---|---|---|---|---|
| Mom | Full (all kids' point values, all routine editors) | Full CRUD | n/a (her own gamification if enabled) | Sole approver (v1) |
| Dad / Additional Adult | Own values if self-enabled; kids' via task_assignment/edit grants as today | CRUD only with family-wide `reward_rules` grant (#274) | Own (if self-enabled) | No (stub: grantable later) |
| Special Adult | None | None | None | No |
| Independent | View own values (What's-Shared honesty); no editing | None | Yes — honors per-item approval flag | n/a |
| Guided | None visible | None | Yes — honors per-item approval flag | n/a |
| Play | None visible | None | Browse + tap; **always** routes to mom | n/a |

View-As: mom sees the kid's shop exactly as they do; purchases made in View-As carry `acted_by` attribution. Kid-visible ledger history: own rows only, celebration-framed.

---

## 10. Edge Cases

- **Insufficient balance:** never an error state — the Buy button is replaced by warm progress ("37 more!"). The RPC's balance guard is the backstop for stale UI, returning a friendly retryable message.
- **Race on balance:** row-lock in `record_point_transaction` serializes concurrent purchases; the second one sees the reduced balance.
- **Item archived while a purchase is pending:** the purchase row's snapshot (name/cost) stands; mom can still approve or decline. New purchases blocked.
- **Point values changed mid-week:** non-retroactive everywhere (balances, past awards, pending purchases keep their snapshot cost).
- **Routine mode changed mid-day:** propagates live; idempotency keys prevent double-award within a mode; switching per_step → per_completion mid-day can legitimately award both once that day (never less than promised — celebration-only artifact, accepted).
- **Gamification disabled with pending purchases:** pending purchases remain resolvable; declines refund normally; shop hides for the kid.
- **Shared routine, per_completion:** award to each member who completed ≥1 step that day (§5.3). A kid who did nothing that day gets nothing and is told nothing.
- **Late carry-over completion:** completes the scheduled day retroactively; award fires with the scheduled day's idempotency key.
- **Kid with no assigned work + gated item:** gate passes (0/0 = 100%, allowance parity).
- **Purchase limits:** window counts `pending + approved + auto_approved` (a pending purchase consumes the slot; cancel/decline frees it).
- **Daily goal crossed twice** (goal raised mid-day after firing, or points spent then re-earned past the line): the `dpg:{member}:{date}` idempotency key means the deed fires at most once per family-local day; an already-fired day never un-fires (#219). Spending never subtracts goal progress (earn-sum display, §5.6).
- **Shared routine, per_step — attribution pin (rider 3):** kid A completes four steps of a shared routine → exactly four step-awards to A (`routine_step_completions.member_id`), zero to other assignees. Same rule allowance already uses.
- **Three independent rails pin (rider 4):** an extra-credit shared routine (`counts_for_allowance=true`, `is_extra_credit=true`) with per-step points on, step completed by kid A → (a) A's allowance NUMERATOR boosted (extra-credit semantics), (b) NO kid's denominator changes, (c) A receives the step's points. `counts_for_allowance` and `counts_for_gamification` flip independently — either off silences only its own rail. This pin doubles as the regression guard on the `calculate_allowance_progress` rewrite (§5.3 precondition).

---

## 11. Stubs (registered, deliberately NOT built)

| Stub | Wires to |
|---|---|
| Treasure boxes (ceremonial containers, video reveals, points-threshold unlock) | Future build composing shop catalog + `reveal_animations` ceremony |
| Dollars as a shop currency | Money never mixes with points (PRD-24 D16); real-money spending stays in the financial system |
| Scheduled shop-item availability | Universal Scheduler (#23) when wanted; v1 has active flag + purchase limits |
| Per-member price overrides / per-intention point values / per-deployment routine values | Config-depth follow-ups on demand |
| Daily 3rd/5th-task bonuses + streak milestone bonuses | Contract patterns (`above_daily_floor` / `streak` IF patterns exist); `bonus_at_three`/`bonus_at_five` stay dormant |
| Levels, achievements, leaderboard | PRD-24 remainder, own future pack |
| Family Best Intentions tallies awarding personal points | Founder decision when wanted (§5.4) |
| Purchase-approval grant for dads | Extension of `reward_rules` or a new grant key |
| Reveal ceremony on purchase | Treasure-box build |
| LiLa context of shop/balance ("you're 13 stars from that bookstore trip") | Next LiLa context-assembly pass (#57 pattern) |
| Friendly "reward on daily goal" quick-config (v1: mom authors it on the Contracts page; the deed + display ship now) | Small follow-up on the Points settings section |

---

## 12. Cross-PRD / Convention Impact

- **Convention #271/#278 Rider 2:** the routine-completion event is the first NEW consumer of `get_member_day_obligations` since FO-COMMAND-CENTER — it routes the denominator question correctly and extends the invariant-test corpus. The semantic-day-match fix amends the Layer-2/allowance section matching (both SQL sites + client parity documented).
- **Convention #221:** GamificationSettingsModal section list amended (Points section).
- **Convention #223:** `point_transactions` adopts the append-only ledger discipline (second instance after `financial_transactions`; `family_goal_contributions` is the third sibling).
- **Convention #224:** `counts_for_gamification` now enforced by the live points path (was enforced only by the dropped `roll_creature_for_completion`).
- **Convention #259:** three new template columns + five new step columns join the live-propagation contract.
- **Convention #274:** `reward_rules` grant extends to Shop management (same class as `/contracts`).
- **New convention (proposed at build close-out):** "All `gamification_points` mutations route through `record_point_transaction()`. `point_transactions` is append-only. Point awards resolve config-as-truth (payload wins only when explicitly set). Points are never deducted as punishment — the only negative transactions are voluntary spends, refunds, and mom's explicit adjustments."
- **STUB_REGISTRY corrections at close-out:** R1 row (per-step routine rewards) → superseded-by-PECON; `routine_points_mode`/`bonus_at_*`/`points_override` dormant registrations; `gamification_events` never-built note.

---

## 13. Founder Decision Record

*(Filled at approval — decisions D-PECON-1 … D-PECON-8 live in `claude/dispatch-factory/PECON.md` and the design-session summary. Record rulings here verbatim when resolved.)*

| # | Decision | Ruling | Date |
|---|---|---|---|
| D-PECON-1 | Config-as-truth resolution + the three pipeline repairs | **Yes** — mom's settings must do what they say; fixes ride the build that needs them. Built: `execute_points_godmother` rewritten config-as-truth, `ensure_point_economy_contracts()` + trigger closes the provisioning gap, never-diverged payload NULLing protects hand-edited contracts. | 2026-07-07 |
| D-PECON-2 | Per-routine points on the template (default none; live propagation; per-kid mode retired; shared-routine contribution rule) | **Yes** — her exact ask, at the level she thinks in (per routine). Built: `task_templates.routine_points_mode`/`routine_step_points`/`routine_completion_points`, live-propagating per Convention #259; `gamification_configs.routine_points_mode` retired in place (confirmed read by zero code paths); shared-routine completion awards every distinct contributor exactly once via `routine_step_completions.member_id`, never `assignee_id`. | 2026-07-07 |
| D-PECON-3 | Intention points: one per-kid value, default off | **Yes** — one number, per-intention overrides later if wanted. Built: `gamification_configs.intention_tally_points` (NULL = no award, deliberate off-by-default). | 2026-07-07 |
| D-PECON-4 | Shop shape: family catalog, per-item audience/cost/approval; Play always-approval; reward_rules grant; display name | **Yes** + founder picks the name — "Reward Shop." Built: `reward_shop_items` family-wide catalog, per-item `audience_member_ids`/`point_cost`/`requires_approval`, Play members always pend server-side regardless of the flag, `reward_rules` explicit family-wide grant (Convention #274 shape). | 2026-07-07 |
| D-PECON-5 | Spend mechanics: append-only ledger, deduct-at-purchase w/ refund, purchases → earned_prizes | **Yes** — race-safe, honest, reuses the whole prize pipeline. Built: `point_transactions` append-only ledger + `record_point_transaction()` choke point (Worker A); `reward_shop_purchases` deducts at purchase time (points held, not merely earmarked) via 3 SECURITY DEFINER RPCs; `earned_prizes` created only at auto-approve/mom-approve (`source_type='store_purchase'`), never revoked. | 2026-07-07 (earning), 2026-07-08 (shop) |
| D-PECON-6 | Completion-% as unlock gate (weekly window, progress-forward framing), in scope v1 | **Yes-as-gate** (her instinct was right: it's a rate, not a currency). Built: `member_completion_percentage()` reusing the Convention #271 blend, minus money/pool coupling; warm progress framing, never a list of misses; 0-assigned = ungated (allowance parity). | 2026-07-08 |
| D-PECON-7 | Points-only v1; dollars + treasure boxes stubbed | **Yes** — money never mixes (Convention #223/PRD-24 D16); treasure boxes = natural v2 on this catalog. Registered as a deferred stub in STUB_REGISTRY.md under PECON-SHOP. | 2026-07-08 |
| D-PECON-8 | PECON supersedes RSTP (step-prize scope carried intact as its own slice) | **Yes** — one payout point, one build, no conflicting packs. Built: `process_routine_step_completion()` is the single payout point for per-step points, per-completion points, AND per-step prizes (privilege/custom → `earned_prizes`, money → `grant_money`, stars → ledger override) — mirrors `award_custom_reward_for_completion`'s structural precedent. | 2026-07-07 |
| Riders 1–4 | Per-task point values (`points_override` reused); daily points goal (optional, celebration-only, contracts-hookable); per-step shared attribution PINNED; three-independent-rails PINNED | **Founder-directed 2026-07-07** ("two additions… two more requirements, both to PIN with tests") — all 4 built and Playwright-pinned by Worker A: `tasks.points_override` "Points for this task" field; `gamification_configs.daily_points_goal` + `member_points_today()` + `daily_points_goal_met` deed; the shared-routine attribution pin (every distinct contributor, exactly once, zero free-riders); the three-independent-rails pin (`counts_for_allowance`/`is_extra_credit`/`counts_for_gamification` flip independently). | 2026-07-07 |

**Checkpoint 5 (whole-PECON, both workers) closed 2026-07-08 with zero Missing.** Full verification table lives in `.claude/rules/current-builds/PECON-earn.md` (Worker A) and `.claude/rules/current-builds/PECON-shop.md` (Worker B, this build's own table plus a combined summary). Two unplanned security findings surfaced and were fixed same-session (migrations 100298, 100300 — see Worker A's build file and CLAUDE.md Convention #280's closing paragraph); Worker B applied that lesson proactively to all 3 new RPCs from the first draft. One real product bug was found live by Worker B's own Convention #277 eyes-on tour and fixed same-session (queue-badge/empty-state aggregation omitting store purchases — see CLAUDE.md Convention #281's closing paragraph). Nothing has been committed as of this record — both builds hold for founder eyes-on and explicit commit/push approval.

---

*End of PRD-24 Point Economy Addendum*
