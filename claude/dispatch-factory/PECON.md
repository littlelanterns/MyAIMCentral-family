# Pre-Dispatch Pack — PECON: Point Economy (Earning Config + Reward Shop)

> **Factory status:** synthesized → decisions-pending (8 decisions, batch 10)
> Produced: 2026-07-07 (Fable 5 design session, founder direct ask). Item ID: PECON. Priority: **P2** (founder pull).
> **SUPERSEDES `RSTP.md`** — the per-step routine-rewards scope (batch-7 rulings D-RSTP-1/2, founder-approved) carries INTACT into Worker A Slice 3 below. RSTP.md now carries a tombstone header; never dispatch it.
> Spec of record: `prds/addenda/PRD-24-Point-Economy-Addendum.md` (THE design — data model, screens, edge cases, celebration rules). This pack is scope + sequencing + dispatch.
> Evidence: `claude/dispatch-factory/TRKG-RSTP-RECON.md` (RSTP section, still accurate) + the 2026-07-07 design-session recon (three parallel code agents + two read-only production queries — findings baked into the addendum §3, with file:line citations preserved there).
>
> **FOUNDER RIDERS 2026-07-07 (post-design, pre-dispatch — the buffet use case):** (1) per-task point
> values — `tasks.points_override` verified write-side-live/read-side-dead → REUSED as THE per-task
> value, surfaced in the task editor (wiring it = honesty repair #5: opportunity/sequential/randomizer
> per-item point amounts finally pay); (2) optional per-kid DAILY POINTS GOAL ("10 points a day", warm
> "7/10 today" progress, goal-met deed hookable by contracts, missing NEVER punishes, off = invisible);
> (3) per-step shared-routine attribution to the ACTUAL completer — PINNED with a named E2E test;
> (4) three-independent-rails PIN — extra-credit-numerator-only allowance behavior must survive points
> untouched (`counts_for_allowance` ⊥ `counts_for_gamification`). All folded into rulings 10-12 and
> Worker A below; addendum §1.1/§5.1/§5.6/§10 carry the full spec. Points are a NEUTRAL COMPOSABLE
> PRIMITIVE — some families ignore them, some run their whole economy on them; every point surface
> renders only when its config is set.
>
> **HEADLINE: the existing points pipeline has four defects that this build fixes on the way to the new features.** (1) Mom's "Points per task" setting is a dead lever — awards read a one-time `contracts.payload_amount` snapshot from the 100219 cutover, so editing the setting has changed nothing since Phase 3 shipped. (2) Members enabled after the cutover have NO points contract and earn zero. (3) Best-intention tallies fire `intention_iteration` deeds that no contract matches — they earn nothing, which is exactly half the founder's ask. (4) Latent: `daily`/`weekly` routine sections store `frequency_days=NULL`, and both `get_member_day_obligations` AND `calculate_allowance_progress` match sections via `= ANY(frequency_days)` — never true for NULL. Production-verified: 12 such sections, all on UNDEPLOYED templates (zero harm today), but the first daily-section routine mom deploys silently drops out of allowance math and the new routine-completion event.

## Rulings

1. **Config-as-truth point resolution (D-PECON-1, amended by rider 1).** `execute_points_godmother` (rewrite the CURRENT 100210 body) resolves: `payload_amount` when NOT NULL (custom contracts keep working) → else by deed source_type: task_completion → `tasks.points_override` (the per-task value; already written by the opportunity/sequential/randomizer bridge paths via `resolveRewardProperties`, now also by the task editor) → `gamification_configs.base_points_per_task`, honoring `counts_for_gamification=false`; intention_iteration → new `gamification_configs.intention_tally_points` (NULL=off). Migration backfills existing `task_rewards` stars/points rows (3 in prod) into `points_override`; the task editor's reward-type dropdown drops its dead stars/points options (prizes only: money/privilege/custom). Same architecture ruling TRKG made for sticker-book modes: godmothers read config tables, payloads are for custom rules. Migration NULLs `payload_amount` on standard contracts ONLY where it still equals the kid's current `base_points_per_task` (never-diverged rule — deliberate edits keep payload semantics). `ensure_point_economy_contracts()` + trigger on `gamification_configs` + backfill closes the provisioning gap; standard contracts stamped `source_category='point_economy'`.
2. **Per-routine points live on the TEMPLATE (D-PECON-2):** `task_templates.routine_points_mode` ('none' default / 'per_step' / 'per_completion') + `routine_step_points` + `routine_completion_points`, live-propagating per Convention #259. Mom sets them in the routine editor's Rewards & Completion Tracking card, NOT a buried settings page. Per-kid `gamification_configs.routine_points_mode` retired in place (never read — recon-verified). Default 'none' = zero economy change until mom opts each routine in.
3. **The routine-completion event routes through `get_member_day_obligations` (Convention #271 / #278 Rider-2 law).** "Did the kid finish everything scheduled today" is an assigned-denominator question — NEVER derived inline. One SECURITY DEFINER RPC `process_routine_step_completion(p_completion_id)` called never-throws from `useCompleteRoutineStep` (additive #199) handles per-step points, completion evaluation, AND step prizes in one round trip. Idempotency: `rsp:{step}:{member}:{date}:{instance}` / `rcp:{task}:{member}:{date}` UNIQUE keys. Uncheck NEVER revokes (#219). Shared routines: completion award to every assignee who completed ≥1 step that day. **Precondition:** the semantic section-day-match fix (defect 4) lands FIRST in both `get_member_day_obligations` and `calculate_allowance_progress` (CURRENT 100247 bodies): 'daily'/NULL → all days, 'weekdays' → DOW 1-5, 'custom' → array, 'weekly'/'monthly' → match-all (client-reader parity); invariant-test corpus extended.
4. **Per-step PRIZE rewards — RSTP scope carried intact (D-PECON-8, prior D-RSTP-1/2 approved batch 7):** 5 additive columns on `task_template_steps` (reward_type CHECK 'privilege'/'custom'/'money'/'stars', reward_amount, reward_description, reward_image_url, reward_image_asset_key), live-propagating; paid inside the same RPC — privilege/custom → `earned_prizes` `source_type='routine_step'`, money → `grant_money`, stars → the ledger (acts as per-step points override); immediate, idempotent-per-day, never revoked, no approval gate, no deed-per-step; RoutineSectionEditor config w/ three-mode RewardImagePicker; serializer + `update_routine_template_atomic` extended from CURRENT bodies.
5. **Points ledger + choke point (D-PECON-5):** `point_transactions` append-only (#223 discipline — INSERT via SECURITY DEFINER only, no client write policies, `balance_after` on every row, `idempotency_key` UNIQUE). `record_point_transaction()` row-locks `family_members`, guards spends, updates `gamification_points` + inserts atomically. `grant_points` retrofitted to delegate (godmother signature untouched); Reset & Advanced balance resets become 'adjustment' rows; opening-balance backfill per member. Delete the dead `src/lib/gamification/grantPoints.ts` wrapper (zero importers).
6. **The Reward Shop (D-PECON-4/5):** family-level `reward_shop_items` catalog (per-item audience pills, single point cost, per-item `requires_approval` default ON, purchase limits per day/week/month/lifetime, optional unlock gate, RewardImagePicker, bulk-AI-add w/ HITM per #252) + `reward_shop_purchases` lifecycle (pending/approved/declined/cancelled/auto_approved). **Deduct-at-purchase with refund-on-decline/cancel** (race-safe via the ledger row lock). Approved purchases create `earned_prizes` rows (`source_type='store_purchase'`, 100266 visibility model) — redemption/history/Prize Board work day one, zero new redemption machinery. Approval cards render in the Queue RequestsTab from their own table (the `reward_proposals` precedent — `family_requests` has no payload column). Play shell: ALL purchases require approval. Management: mom + `reward_rules`-granted adults (#274); approvals mom-only v1. Purchase RPC authorizes member session OR family-shadow (`util.is_family_shadow_of` — the FDWA lesson; do not repeat `redeem_own_prize`'s missing shadow branch) OR mom acting-for with `acted_by`.
7. **Completion-% is an unlock GATE, never a currency (D-PECON-6, founder idea ruled):** `unlock_rule JSONB` v1 type `{type:'completion_pct', threshold, window:'week'}`, evaluated by new thin `member_completion_percentage()` reusing the #271 counting blend (routine days via Layer 1 + non-routine direct — the allowance RPC's documented approach, minus money/pool coupling). Framing law: locked items show warm progress toward the threshold, never list what was missed, never re-lock an already-purchased item; 0-assigned = ungated (allowance parity).
8. **Kid surfaces:** My Rewards gains a Shop section (`my_rewards_sections.shop`, default ON where gamification enabled) — Buy / progress-toward-cost / gate-progress states, pending w/ "Take it back"; Play gets the picture-shelf variant (image tiles, star-chip costs, minimal numbers, no gated items rendered). Mom surfaces: Prize Board gains a **Shop** tab; GamificationSettingsModal gains a **Points** section (task base + intention value + routine glance-list + currency + shop door) — the ONE per-kid points surface. `useRewardProvenance` gains `'routine_step'` + `'store_purchase'` (merge with TRKG's `'widget'` — second lander merges).
9. **Celebration-only law:** points never deducted as punishment (only voluntary spends, refunds, explicit mom adjustments — all ledgered); rate changes never retroactive; per_step-vs-per_completion is pacing, not pressure; no missed-day or can't-afford shame surface anywhere; purchases never revoked by later weeks.
10. **Per-task point values (rider 1):** "Points for this task" number input in the Rewards & Completion Tracking card (gated on `counts_for_gamification`, placeholder = the kid's default — exact `allowance_points` symmetry), writing `tasks.points_override`. One value per task; each assignee's default applies only when empty.
11. **Daily Points Goal (rider 2):** `gamification_configs.daily_points_goal INTEGER NULL` (NULL = invisible). Display = "7/10 today" warm progress on My Rewards Points section (incl. Play variant) + existing dashboard points readouts, via new `member_points_today()` RPC (SUM of today's `'earn'` transactions at `families.timezone` — #257 server-derived day; spending/refunds/adjustments never subtract progress). `record_point_transaction()` fires a `daily_points_goal_met` deed once per member per family-local day on crossing (`idempotency_key='dpg:{member}:{date}'`); contracts hook it (`contracts.source_type` CHECK widened + ContractForm option; verify whether `deed_firings.source_type` carries a CHECK too). Missing the goal renders NOTHING. v1 ships deed + display; no auto-authored contracts.
12. **Two named pins (riders 3-4, tests not just design):** (a) shared-routine per-step attribution — kid A completes four steps of a shared routine → exactly four step-awards to A (`routine_step_completions.member_id`), zero to other assignees; (b) three-independent-rails — an extra-credit shared routine (`counts_for_allowance=true, is_extra_credit=true`) step completed by kid A boosts A's allowance NUMERATOR, changes NO kid's denominator, AND pays A the step's points when per-step mode is on; `counts_for_allowance` ⊥ `counts_for_gamification` proven by flipping each independently. Pin (b) doubles as the regression guard on the `calculate_allowance_progress` rewrite.

## Slice plan (TWO Sonnet workers, sequential A → B)

| Worker | Slice | Scope | Routing |
|---|---|---|---|
| **A — PECON-EARN** | A1 | Migration 1: `point_transactions` + `record_point_transaction` + `grant_points` retrofit + opening-balance backfill + semantic section-day-match rewrite of `get_member_day_obligations` + `calculate_allowance_progress` (CURRENT 100247 bodies) + invariant-corpus extension | Sonnet xhigh + rls-verifier |
| | A2 | Migration 2 + config: `execute_points_godmother` config-as-truth rewrite (CURRENT 100210 body; resolution incl. `points_override`) + never-diverged payload NULLing + task_rewards stars/points → points_override backfill + `ensure_point_economy_contracts` + trigger + backfill + `intention_tally_points` + `daily_points_goal` columns + goal-met deed in `record_point_transaction` + `member_points_today` RPC + contracts source_type CHECK widening + template columns (`routine_points_mode`/`routine_step_points`/`routine_completion_points`) + step reward columns + `process_routine_step_completion` RPC | Sonnet xhigh + rls-verifier |
| | A3 | Client: `useCompleteRoutineStep` never-throws RPC call; routine editor Points block + per-step reward config (RoutineSectionEditor + serializer + atomic-RPC ext.); "Points for this task" field + reward-dropdown simplification (TaskCreationModal); GamificationSettingsModal Points section (incl. daily goal); daily-goal progress displays (My Rewards Points section + Play/Guided dashboard readouts); ContractForm `daily_points_goal_met` option; provenance ext.; delete dead wrapper | Sonnet xhigh |
| | A4 | E2E `tests/e2e/features/point-economy-earning.spec.ts` (see proof list in dispatch) + eyes-on tour + registry corrections | Sonnet xhigh |
| **B — PECON-SHOP** | B1 | Migration 3: `reward_shop_items` + `reward_shop_purchases` + purchase/resolve/cancel RPCs + `member_completion_percentage` + feature key seeds | Sonnet xhigh + rls-verifier |
| | B2 | Mom UI: Prize Board Shop tab (item CRUD, BulkAddWithAI w/ HITM, pending strip, history); Queue `StorePurchaseCard`; notifications | Sonnet xhigh |
| | B3 | Kid UI: My Rewards Shop section (+`my_rewards_sections.shop`) + Play picture shelf + purchase confirm/pending/cancel states + client celebration | Sonnet xhigh |
| | B4 | E2E `tests/e2e/features/point-economy-shop.spec.ts` + eyes-on tour + docs close-out (STUB/WIRING/CLAUDE.md convention/live_schema/help-patterns/feature-guide-knowledge) | Sonnet xhigh |
| Gates | Checkpoint 5 per worker | | **Fable if available, else Opus** |

## Open founder decisions (batch 10 — recommendations first, full context in the addendum + session summary)

| # | Decision | Recommendation |
|---|---|---|
| D-PECON-1 | Config-as-truth resolution + the three pipeline repairs (dead lever, provisioning, intentions) | **Yes** — mom's settings must do what they say; fixes ride the build that needs them |
| D-PECON-2 | Per-routine points on the template, default 'none', live propagation, per-kid mode retired; shared-routine completion award = contributors-only | **Yes** — her exact ask, at the level she thinks in (per routine) |
| D-PECON-3 | Intention points = one per-kid value (not per-intention), default off | **Yes** — one number, per-intention overrides later if wanted |
| D-PECON-4 | Family catalog + per-item audience/cost/approval; Play always-approval; mom + reward_rules-granted manage; display name "Reward Shop" | **Yes** + founder picks the name |
| D-PECON-5 | Append-only ledger; deduct-at-purchase w/ auto-refund; purchases → earned_prizes | **Yes** — race-safe, honest, reuses the whole prize pipeline |
| D-PECON-6 | Completion-% as weekly unlock GATE, in scope v1, progress-forward framing | **Yes-as-gate** (her instinct was right: it's a rate, not a currency) |
| D-PECON-7 | Points-only v1; dollars-as-currency + treasure boxes stubbed | **Yes** — money never mixes (#223/PRD-24 D16); treasure boxes = natural v2 on this catalog |
| D-PECON-8 | PECON supersedes RSTP; step-prize scope rides as Worker A Slice 3 unchanged | **Yes** — one payout point, one build, no conflicting packs |
| Riders 1–4 | Per-task values (points_override reused) · daily points goal · per-step shared-attribution pin · three-rails pin | **Founder-directed 2026-07-07** — not open decisions; folded into rulings 1/10/11/12; awaiting her updated-scope confirmation before Worker A dispatches |

## Dependency edges

- Consumes KIDS-REWARDS earned-prizes pipe + RewardImagePicker + `my_rewards_sections` machinery (all shipped).
- Shares `useRewardProvenance` with TRKG (`'widget'`) — second lander merges. TRKG remains a SEPARATE pack (tracker goals + mode honesty); its tracker events are a natural FUTURE point source via the same config-as-truth resolution (extension note, not scope).
- Touches migration-100210/100219/100247 lineages — coordinate if any parallel session edits `execute_points_godmother`, `dispatch_godmothers`, `get_member_day_obligations`, or `calculate_allowance_progress`. The A1 allowance rewrite means the allowance E2E pins must stay green.
- FDWA (family-shadow policies): the purchase RPC ships its own shadow branch; whoever lands second re-verifies no overlap.
- Prize Board / My Rewards / Queue RequestsTab territory: KIDS-REWARDS shipped; FAMILY-GOALS-PRIZES shipped — re-verify current component state at build time (freshness preamble).
- No upstream blockers. Suggested queue slot: **immediately after the in-flight safety-sequence deploys** (founder pull item), ahead of the P3 chains; TRKG can run before or after (no hard edge either way once the provenance merge note is honored).

---

## DISPATCH PROMPT — Worker A: PECON-EARN (paste into a FRESH session after batch-10 decisions resolve)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PECON Worker A (PECON-EARN) — the point-economy EARNING
side: the points ledger, config-as-truth repair, per-TASK point values, per-routine point modes,
the routine-completion event, the daily points goal, and per-step prize rewards. Pack:
claude/dispatch-factory/PECON.md (12 rulings, slices A1-A4 are yours; the Shop is Worker B, NOT
yours). Spec of record: prds/addenda/PRD-24-Point-Economy-Addendum.md — read it in FULL; §1.1
(founder riders) + §5 are your requirement list, §8 your data model, §10 your edge cases.
Decisions D-PECON-1..8 RESOLVED per recommendations unless the founder noted otherwise; riders
1-4 are founder-directed scope.

FRESHNESS PREAMBLE: pack produced 2026-07-07. git log --since=2026-07-07; base EVERY function
rewrite on the CURRENT production body (execute_points_godmother = 100210 lineage;
get_member_day_obligations + calculate_allowance_progress = 100247 lineage;
update_routine_template_atomic = 100178 lineage — the copy-stale-body failure mode is documented
in the KIDS-REWARDS build file; check for later revisions FIRST). Check whether TRKG landed
(useRewardProvenance merge). Next free migration number at file-creation time, re-checked
immediately before applying; if foreign unapplied migrations are pending, apply ONLY yours via
supabase db query --linked -f with idempotent SQL — never batch-push other sessions' work.

READ FIRST: (1) the addendum (full); (2) CLAUDE.md Conventions #199/#202/#219/#221/#223/#224/
#257/#259/#266/#267/#271/#278-Rider-2 — the law this build lives under; (3) the pack + 
claude/dispatch-factory/TRKG-RSTP-RECON.md (RSTP section file:line map); (4) migration 100247
in full (you are rewriting two of its functions); (5) the KIDS-REWARDS build file Slice 1
section (guard-ledger lesson). Create .claude/rules/current-builds/PECON-earn.md (no YAML
frontmatter), pre-build summary, founder approval BEFORE code.

HARD RULES:
- ALL gamification_points mutations route through record_point_transaction() — row-locked,
  balance_after on every row, idempotency_key UNIQUE, append-only (#223: no client write
  policies, no UPDATE/DELETE ever). grant_points becomes a delegating wrapper (signature
  untouched — dispatch_godmothers is NOT edited).
- The routine-completion check consumes get_member_day_obligations (#271/#278-Rider-2). NEVER
  derive the day's scheduled-step set inline. The semantic day-match fix (daily/NULL→all days,
  weekdays→DOW 1-5, custom→array, weekly/monthly→match-all client parity) lands in BOTH 100247
  functions BEFORE the event ships, with the invariant-test corpus extended
  (tests/routine-day-state-invariant.test.ts — change SQL and mirror together).
- Awards are ADDITIVE never-throws (#199 — a failed award never blocks the checkmark); one award
  per idempotency key — recheck never double-awards, uncheck NEVER revokes (#219); attribution =
  routine_step_completions.member_id, never assignee_id (#202/#267); shared per_completion award
  = every assignee with ≥1 completion that day.
- New template/step columns propagate live per #259 — the propagation E2E probe is required
  (master edit adds/changes points mode → deployed routine reflects it).
- No deeds at step granularity (a 10-step routine must not fire 10 deeds); member-level sources
  (task, intention) ride the connector via standard contracts stamped
  source_category='point_economy' with payload_amount NULL; the never-diverged NULLing rule
  protects mom-edited contracts.
- period_date is server-derived (#257 — trigger 100157/100245 lineage governs
  routine_step_completions; do not fight it); the daily-goal "today" is the FAMILY-local day
  (member_points_today at families.timezone — never client day math); three-mode
  RewardImagePicker reuse, never bespoke; Lucide only, no emoji; theme tokens only;
  celebration-only framing everywhere (ruling 9) — the daily goal renders NOTHING on a miss and
  is invisible when unset (points are a neutral composable primitive).
- Three independent rails: counts_for_allowance and counts_for_gamification are separate
  switches and MUST stay separate — your calculate_allowance_progress rewrite (A1) changes ONLY
  section-day matching, never extra-credit/numerator semantics (ruling 12b pin is the guard).

PROOF (tests/e2e/features/point-economy-earning.spec.ts, PECON-prefixed service-role fixtures,
swept beforeAll+afterAll, zero residue): ledger invariant (SUM(amount) = balance_after = 
gamification_points after mixed operations); dead-lever repair (edit base_points_per_task →
next completion awards the NEW value); provisioning repair (fresh enabled member earns on first
completion); intention tally awards when value set, nothing when NULL; PER-TASK OVERRIDE pin
(task with points_override=5 pays 5, not the base; an opportunity-claim bridge task's per-item
points pay); per_step routine awards per check w/ same-day recheck no-double + uncheck
no-revoke; per_completion awards ONLY when the day's full obligation set completes, incl. a
daily-section (frequency_days NULL) routine — the defect-4 probe; carry-over completion awards
the scheduled day; RIDER-3 PIN — shared routine, kid A completes four steps → exactly four
step-awards to A (routine_step_completions.member_id), zero to other assignees; RIDER-4 PIN —
extra-credit shared routine (counts_for_allowance + is_extra_credit) step by kid A → allowance
numerator boost for A + NO denominator change for ANY kid + A paid the step's points with
per_step on, then counts_for_gamification=false silences ONLY points and counts_for_allowance=
false silences ONLY allowance; DAILY GOAL pins — progress = today's earn-sum at family timezone
(spend does not subtract), goal-met deed fires exactly once per day (recheck/re-cross no-double),
NULL goal renders no UI and fires nothing, a contract on daily_points_goal_met grants; per-step
prize → earned_prizes routine_step provenance; money step reward → financial ledger row;
propagation probe. Plus: tsc -b, lint,
allowance pins (you rewrote calculate_allowance_progress — fo-command-center + kids-rewards
suites; ask the founder before shared-fixture suites), Convention #277 eyes-on tour of the
routine editor Points block + the "Points for this task" field + Settings Points section (incl.
daily goal) + the "7/10 today" progress on a kid dashboard + a kid checking a rewarded step.
NOTHING COMMITS until green + founder eyes-on (put 1 point per step on a real schoolwork
routine and 1 point per completion on a grooming routine, set a daily goal for one kid, have a
kid run them, watch the ledger and the goal progress).
Selective staging; founder confirms before push. Close-out: Checkpoint 5, STUB corrections
(R1 row → superseded by PECON; routine_points_mode/bonus_at_*/points_override dormant
registrations), Convention amendment proposal, live_schema regen, hand off live state to
Worker B in the build file.
```

## DISPATCH PROMPT — Worker B: PECON-SHOP (paste into a FRESH session AFTER Worker A's Checkpoint 5)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PECON Worker B (PECON-SHOP) — the Reward Shop: catalog,
purchase lifecycle, approval flow, unlock gates, and all kid/mom surfaces. Worker A (ledger +
earning) has shipped — read its progress log in .claude/rules/current-builds/PECON-earn.md (or
the archived copy) for the live state of record_point_transaction and the ledger BEFORE writing
anything. Pack: claude/dispatch-factory/PECON.md (rulings 6-9, slices B1-B4). Spec of record:
prds/addenda/PRD-24-Point-Economy-Addendum.md — §6/§7/§8.2-8.3/§9/§10 are your requirement list.

FRESHNESS PREAMBLE: git log since the pack date; re-verify PrizeBoard.tsx tab structure,
MyRewards.tsx section list, RequestsTab.tsx card composition, and useMyRewardsSettings defaults
against CURRENT code (KIDS-REWARDS + FAMILY-GOALS-PRIZES both shipped into these files).
Migration number protocol as always (next free, re-check before applying, never batch-push
foreign migrations).

READ FIRST: (1) the addendum §6-§10; (2) the pack; (3) migration 100266 (earned_prizes
visibility model + redeem_own_prize — you are creating prizes into this model) + 100278
(reward_proposals — your Queue-card precedent) + 100284 (nullable family_member_id CHECK);
(4) CLAUDE.md #221/#223/#252/#274/#276/#278; (5) src/components/queue/RequestsTab.tsx +
src/components/rewards/MyRewards.tsx + src/pages/PrizeBoard.tsx. Create
.claude/rules/current-builds/PECON-shop.md, pre-build summary, founder approval BEFORE code.

HARD RULES:
- Purchases deduct at purchase time through record_point_transaction (spend guard, row lock) and
  refund on decline/cancel — the ledger is the truth; reward_shop_purchases rows are written
  ONLY by the three SECURITY DEFINER RPCs (no client INSERT policy).
- earned_prizes rows are created ONLY at auto-approve or mom-approve (never pending), with
  source_type='store_purchase', name/image snapshotted from the item, visibility 'family',
  created_by = item.created_by. Never revoked (#278). Redemption reuses the EXISTING flow —
  build zero new redemption machinery.
- The purchase RPC authorizes: the member's own session (user_id match) OR a family-shadow
  session (util.is_family_shadow_of — Convention #276; redeem_own_prize's missing shadow branch
  is the documented failure to NOT repeat) OR a parent acting-for with acted_by attribution.
- Play shell: EVERY purchase requires approval regardless of the item flag; gated items don't
  render on Play; costs as star chips, minimal numbers, Lucide only.
- Unlock gates call member_completion_percentage() (built on the #271 counting blend — if Worker
  A did not ship it, you build it per addendum §6.4; it must gate through
  obligation_active_for_member_on_date, never inline day math). Framing law: warm progress
  toward the threshold, never a list of what was missed, never re-lock a purchased item,
  0-assigned = ungated.
- Shop management RLS: mom + family-wide reward_rules grant (#274); approvals mom-only v1.
  Catalog items are data not code. BulkAddWithAI on the item editor (#252 — shipping a
  multi-item creation surface without bulk-AI-add is a bug) with HITM review before save.
- Queue card follows the reward_proposals precedent (own table rendered in RequestsTab — never
  family_requests rows). Notifications: createNotification util (never chain .select() — the
  documented 42501 gotcha), category 'requests' for pending, 'gamification' for kid outcomes.
- Insufficient balance is NEVER an error/shame state — progress framing ("37 more!"), RPC guard
  as backstop with a friendly message. No hardcoded currency strings — read
  gamification_configs.currency_name per kid.

PROOF (tests/e2e/features/point-economy-shop.spec.ts, PECON-prefixed fixtures, swept, zero
residue): auto-approve purchase → spend txn + earned_prizes + quiet mom notification, balance
math exact; approval purchase → pending + points held, mom approve → prize + kid notification,
mom decline → refund txn + no prize; kid cancel → refund; race probe (two concurrent purchases
against one balance → exactly one succeeds when balance covers only one); audience scoping (kid
outside audience never sees the item — RLS probe); purchase limit window; gate probe (below
threshold blocked at RPC + UI shows progress, above threshold purchasable, 0-assigned ungated);
Play always-approval; family-shadow purchase probe; RLS leak probes (kid can't write
reward_shop_items, can't read others' purchases). Plus tsc -b, lint, regression pins
(kids-rewards slices — you touch MyRewards/PrizeBoard/RequestsTab — plus leak-pass; ask the
founder before shared suites), Convention #277 eyes-on tour (Shop tab CRUD + bulk-add, kid
Shop section all three states, Play shelf, Queue card, pending/cancel — desktop/tablet/mobile,
mom + Independent + Play roles). NOTHING COMMITS until green + founder eyes-on (stock 3 real
items incl. one gated + one auto-approve, have a real kid buy one on their device, approve it,
watch the prize land in My Rewards). Selective staging; founder confirms before push.
Close-out: Checkpoint 5 for the WHOLE PECON build (Worker A items + yours, zero Missing),
verification table copy-back to the addendum's Founder Decision Record section, Convention #14
Part B docs (STUB_REGISTRY, WIRING_STATUS section, CLAUDE.md new convention, live_schema regen,
help-patterns + feature-guide-knowledge for "reward shop" / "points"), archive both build files.
```
