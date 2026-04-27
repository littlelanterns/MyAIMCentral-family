# REWARDS GROUND TRUTH — 2026-04-25

> Investigative-only ground-truth recon for the central-switchboard / connector-layer design session.
> No code changed. No architecture proposed. Describes what exists.
> Companion to [REWARDS_RECON_2026-04-25.md](REWARDS_RECON_2026-04-25.md) — that doc covers the kid-facing surface; this doc covers the underlying connector-layer ground truth.

---

## §1 — Every existing reward/connector data shape

> **In plain English:** there are *six different table families* that touch "X happened, give Y to Z." Some are real ledgers (financial_transactions, member_creature_collection). Some are config-only and have never had a row written in production (reward_reveals, reward_reveal_attachments, earned_prizes). Some are stub tables that the original PRD planned to grow into (task_rewards, gamification_rewards). And some are downstream-of-completion tables that AIR was supposed to populate but doesn't (victories from task completions). What you do NOT have today is anything that names "a connection between source X and destination Y" as a first-class object — every existing wiring is either hardcoded in a hook (`useTasks.awardOpportunityEarning` reading `task_rewards`) or hardcoded in a SQL function (`roll_creature_for_completion` walking 11 steps). The `reward_reveal_attachments` table is the closest thing today to what you're describing as a junction table, but it only knows about reveal animations and is 0 rows in production.

### 1.1 — The reward / connector / consumer table inventory

| Table | What it attaches to | What it does | Owning feature | Status | Multi-routing? | Cross-table interaction today |
|---|---|---|---|---|---|---|
| `task_rewards` ([migration 00000000000008:281](supabase/migrations/00000000000008_tasks_lists.sql#L281)) | Tasks (1:1 per task_id, no enforced unique constraint) | Stores `reward_type` ∈ `{points, money, privilege, custom}` and `reward_value JSONB` (typically `{amount: N}`). 5 columns total. PRD spec ([PRD-09A:1026](prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md#L1026)) called for a richer schema with `reward_amount DECIMAL`, `bonus_threshold`, `bonus_percentage` — those columns were never added. | PRD-09A (declared as stub for PRD-24) | **Wired (partial)** — written by `createTaskFromData.ts` Step 3 (lines 460-478) and `useOpportunityLists.ts` claim path. **Read by `awardOpportunityEarning()` in [useTasks.ts:99-199](src/hooks/useTasks.ts#L99) — but only when `task_type LIKE 'opportunity_%'` AND `reward_type='money'`. Non-opportunity tasks with `reward_type='money'` get no money. `privilege` and `custom` types are read by no one — display-only on the task card.** | Single-routing only (one row per task_id) | One direction → `financial_transactions` write via `awardOpportunityEarning`. No other consumer in production. |
| `financial_transactions` ([migration 100134:105](supabase/migrations/00000000100134_allowance_financial.sql#L105)) | Family member (kid) | Append-only ledger. Eight `transaction_type` values: `allowance_earned`, `opportunity_earned`, `payment_made`, `purchase_deduction`, `loan_issued`, `loan_repayment`, `interest_accrued`, `adjustment`. `source_type` + `source_reference_id` link back to the producing event (typically `task_completion` + completion.id). RLS: SELECT family-wide; INSERT primary_parent only; **NO UPDATE or DELETE policy** (append-only enforced). | PRD-28 | **Wired** | N/A — destination ledger | Reverse RPC: `reverse_opportunity_earning(p_completion_id)` (migration 100173) writes negative `adjustment` rows; idempotent via partial unique index on `(metadata->>'reversed_completion_id')`. Forward unique: `uq_financial_transactions_forward_per_completion` partial unique on `source_reference_id WHERE transaction_type='opportunity_earned'` (migration 100174). |
| `allowance_configs` (migration 100134:27) | Family member (one config per kid via `idx_allowance_configs_member`) | Per-child allowance configuration: `weekly_amount`, `calculation_approach` ∈ `{fixed, dynamic, points_weighted}`, `default_point_value`, thresholds (`minimum_threshold`, `bonus_threshold`, `bonus_percentage`), grace mechanisms (`grace_days_enabled`, `makeup_window_enabled`, `makeup_window_days`, `extra_credit_enabled`), `child_can_see_finances`, period config, **loan settings** (`loans_enabled`, `loan_interest_enabled`, `loan_default_interest_rate`, `loan_interest_period`, `loan_max_amount`). | PRD-28 | **Wired** | N/A — config | Read by `calculate_allowance_progress` RPC + `calculate-allowance-period` Edge Function + 8+ client hooks. Bulk Configure modal (NEW-SS) writes via `useBulkUpsertAllowanceConfig`. |
| `allowance_periods` (migration 100134) | Family member | Per-period tally row (Sunday-Sunday weekly). 25 columns. Auto-created by `trg_set_allowance_period_dates` trigger (migration 100163). One active period per member (partial unique index `allowance_periods_one_active_per_member`). `grace_days JSONB` accepts both legacy `string[]` and new `{date, mode}[]` shapes per NEW-TT. | PRD-28 | **Wired** | N/A — tally | Reads from `tasks` + `task_completions` + `routine_step_completions` live via RPC. Closes via `calculate-allowance-period` Edge Function (cron-invoked). Writes one `financial_transactions` row at period close. |
| `loans` (migration 100134) | Family member | Outstanding loans with repayment terms, `interest_rate`, `interest_period`. **Cron registered for `accrue-loan-interest` but Edge Function not implemented (Subagent A bug 7.1).** | PRD-28 | **Wired (partial — interest accrual stubbed)** | N/A | Writes `financial_transactions` rows of `transaction_type='loan_issued'`, `'loan_repayment'`, `'interest_accrued'`. |
| `gamification_configs` (live_schema §API-uncatalogued) | Family member (one per kid) | Master gamification toggle + currency + base_points_per_task + streak settings + level_thresholds JSONB + visualization_mode. **20+ of these columns are dormant** — only `enabled`, `currency_name`, `base_points_per_task` are read by code. PRD-24 spec ([PRD-24:580-622](prds/gamification/PRD-24-Gamification-Overview-Foundation.md#L580)) describes a much richer event pipeline that consumes most of the dormant columns. | PRD-24 / Build M | **Wired (master toggle); 80% of columns dormant** | N/A — config | Read by `roll_creature_for_completion` RPC (early-return on `enabled=false`). |
| `member_sticker_book_state` (migration 100115 + 100126) | Family member (one row per kid) | Per-kid sticker book settings: `active_theme_id`, `active_page_id`, **`creature_earning_mode`** ∈ `{random_per_task, every_n_completions, segment_complete, complete_the_day}` + `creature_earning_threshold/counter/segment_ids/counter_resets`, **`page_earning_mode`** ∈ `{every_n_creatures, every_n_completions, tracker_goal}` + 3 supporting columns, `rarity_weights JSONB`, `creature_roll_chance_per_task`, `randomizer_reveal_style`. 25 columns. | Build M | **Wired** (Conventions #198-222) | N/A — config | Read by `roll_creature_for_completion` RPC steps 6-10. Branches the entire pipeline. |
| `member_creature_collection` (migration 100115) | Family member | Per-kid awarded creature inventory. Append-only-by-convention (no decrement code path per Convention #206). Idempotency-safe via UNIQUE constraint on `awarded_source_id`. `awarded_source_type` is currently always `'task_completion'`; `awarded_source_id` is currently always a `task_completions.id`. | Build M | **Wired** | Single-routing — one row per source completion | Written by `roll_creature_for_completion` RPC step 9. Written from 4 hook sites (Convention #198): `useCompleteTask`, `useApproveTaskCompletion`, `useApproveCompletion`, `useApproveMasterySubmission`. **Randomizer mastery does NOT fire RPC** (Convention #205, known gap — no `task_completions` row exists for randomizer mastery exits). |
| `member_page_unlocks` (migration 100115) | Family member | Per-kid sticker page unlocks. `unlocked_trigger_type` ∈ `{creature_count, completion_count, tracker_goal}`. | Build M | **Wired** | Single-routing | Written by RPC step 10 OR by separate logic in `useApproveMasterySubmission`. |
| `member_coloring_reveals` (migration 100126) | Family member + `coloring_reveal_library.id` (the coloring image) + **`earning_task_id` FK** (migration 100127) | Per-kid active coloring reveal progress. **Has 8 earning-mode-related columns** (`earning_mode`, `earning_threshold`, `earning_counter`, `earning_segment_ids`, `earning_tracker_widget_id`, `earning_tracker_threshold`, `lineart_preference`, `is_complete`) — Convention #212 says "4 fields only" — documentation drift, not a functional bug (Subagent E bug #4). | Build M | **Wired** | Single-routing per coloring image (1:1 with `earning_task_id`) | Read by RPC's coloring branch (priority FIRST before any earning-mode logic per Convention #211). |
| `coloring_reveal_library` (migration 100126:88) | Theme (`gamification_themes.id`) | 32 Woodland Felt subjects (20 animals + 12 scenes). `color_zones JSONB`, `reveal_sequences JSONB` (6 step-count variants per subject — 5/10/15/20/30/50). `zone_count` defaults to 50. | Build M | **Wired** (32 rows seeded) | Source library only — N/A | Consumed by `member_coloring_reveals.coloring_image_id`. |
| `gamification_themes` | (Library) | Theme registry. 1 row in production (Woodland Felt). PRD-24A planned 5 launch themes ([PRD-24A:F60c](claude/web-sync/AUDIT_REPORT_v1.md#L1014)) — 4 are roadmap. | Build M | **Partial — 1/5 themes shipped** | N/A | Linked from `member_sticker_book_state.active_theme_id`. |
| `gamification_creatures` | Theme | Per-theme creature library. 161 rows (Woodland Felt). `rarity` ∈ `{common, rare, legendary}`. | Build M | **Wired** | N/A | Picked by RPC step 8 from `theme_id` + `rarity` weighted random. Falls through to lower tiers if higher tier empty. |
| `gamification_sticker_pages` | Theme | Per-theme sticker page library. 26 rows (Woodland Felt). `scene`, `season`, `image_url`, `sort_order`. | Build M | **Wired** | N/A | Picked by RPC step 10 in `sort_order` from un-unlocked pool. |
| `task_segments` (migration 100126:20) | Family member (one segment row per kid per segment) | Per-kid day segment: `segment_name`, `icon_key`, `day_filter INTEGER[]`, **`creature_earning_enabled`**, **`segment_complete_celebration`**, **`randomizer_reveal_style`** ∈ `{show_upfront, mystery_tap}`, `theme_override_id`. | Build M | **Wired** (8 rows in production) | One segment can have many tasks (`tasks.task_segment_id` FK) | Read by RPC's `segment_complete` earning branch via `check_segment_completion()` helper RPC. |
| `tasks.victory_flagged` (column on tasks) | Task | Boolean. PRD-11 ([PRD-11:591](prds/personal-growth/PRD-11-Victory-Recorder-Daily-Celebration.md#L591)) says "task completions with victory_flagged auto-create victory records." | PRD-11 (AIR — Automatic Intelligent Routing) | **Captured but never read** — set in `createTaskFromData.ts:91` and `Tasks.tsx:267`; **no completion handler reads it** (grep `victory_flagged.*true` in src/hooks returns 0 hits). | N/A | Should drive AIR victory creation. Doesn't. |
| `lists.victory_mode` (enum: `none / item_completed / list_completed / both`) | List | List-level setting. Per-item `list_items.victory_flagged BOOLEAN`. | PRD-09B / PRD-11 | **Wired** in [Lists.tsx:1500-1540](src/pages/Lists.tsx#L1500) — checking off an item OR completing a list inserts a `victories` row inline. This is NOT routed through AIR; it's hardcoded in the list-completion site. | N/A | Direct insert into `victories` (source = `list_item_completed` or `list_completed`). Idempotent check before insert. |
| `lists.reveal_type TEXT` (migration 00000000000008:310) | List | **Dormant column.** Never read or written by any code path. PRD-09B's older randomizer reveal architecture seam. F61/F62 flag it as the wire-up point for the new lego connector architecture. | PRD-09B | **Stubbed — column exists, zero consumers** | — | None today. F61 calls it "the connector wire-up point." |
| `tasks.related_intention_id UUID` ([migration 00000000100023:430](supabase/migrations/00000000100023_tasks_prd09a_full.sql) + PRD-09A:848) | Task → Best Intention | Half-wired column. Type definition exists in `src/types/tasks.ts:313`. **No UI sets it.** Grep returns 0 writers in src/. | PRD-09A (BestIntention link stub) | **Stubbed — column exists, zero writers, zero readers** | Was intended for one task → one intention. | None. Removing it would not break anything. |
| `intention_iterations` (PRD-06) | `best_intentions.id` + member + day | Per-iteration counter rows. PRD spec: "no UPDATE or DELETE on iterations. Once recorded, a tap is permanent." `victory_reference TEXT` is a free-form note column, NOT a FK to victories. | PRD-06 | **Wired** | N/A | Written by `useLogIntentionIteration` ([useBestIntentions.ts:410](src/hooks/useBestIntentions.ts#L410)). Triggers DB-level `iteration_count` increment via `trg_increment_iteration_count`. **Emits `activity_log_entries` event with `event_type='intention_iterated'`** — that's the only downstream signal. **No reward/gamification path.** PRD-11 ([PRD-11:416](prds/personal-growth/PRD-11-Victory-Recorder-Daily-Celebration.md#L416)) says "celebrate-tap auto-creates victory" — not implemented. |
| `family_intention_iterations` | Family-level intentions | Same pattern as `intention_iterations` but for family-wide intentions (PRD-14D). | PRD-14D | **Wired** | N/A | Same — no reward path. |
| `widget_data_points` | Widget + family member | Per-data-point log entries on dashboard widgets. PRD-11 ([PRD-11:415](prds/personal-growth/PRD-11-Victory-Recorder-Daily-Celebration.md#L415)) says "data_point creation triggers victory record" — not implemented. PRD-11 ([PRD-11:417](prds/personal-growth/PRD-11-Victory-Recorder-Daily-Celebration.md#L417)) says "widget reaches a configured milestone → auto-create victory" — not implemented. | PRD-10 | **Wired (data writes)**, AIR consumer **not wired** | N/A | None. STUB_REGISTRY:118 falsely claims "Widget milestone → victory ✅ Wired Phase 12" — confirmed false in F58 evidence. |
| `victories` | Family member | Victory log row. `source` ∈ `{manual, task_completed, tracker_entry, intention_iteration, widget_milestone, lila_conversation, notepad_routed, reflection_routed, list_item_completed, routine_completion}`. `source_reference_id` for back-link. **`guiding_star_id` and `best_intention_id` FKs wired** — Activity Scan can detect these connections. | PRD-11 | **Manual + scan-based wired; AIR not wired** | Each victory row links to ONE source event | Created by `useCreateVictory` (manual UI), `VictorySuggestions` (scan-and-claim from `activity_log_entries`), and inline `Lists.tsx` list completion. NO automatic write on task completion / intention iteration / widget milestone. |
| `family_victory_celebrations` | Family-wide | **Table doesn't exist in production.** STUB_REGISTRY:120 falsely claims "Wired Phase 12." Zero src/ consumers (grep returns 0 functional hits). PRD-11B exists as a spec; nothing built. | PRD-11B | **Missing entirely** | — | None. F19 (audit) explicitly flags this. |
| `reveal_animations` (migration 100142) | (Library, no FK from any consumer table other than join-by-id) | Platform-level reveal animation library. 33-34 rows seeded across 11 `style_category` values (paper_craft, minecraft, anime, pokemon, steampunk, unicorn, candy, dnd, retro, pink_purple, css_effect). `reveal_type` ∈ `{video, css}`. `video_url` for video reveals; `css_component` for CSS reveals (e.g., `'DoorOpenReveal'` — note `DoorOpenReveal.tsx` doesn't actually exist in codebase — Subagent E bug #3). | PRD-24B | **Wired as library; consumed only in /dev showcase + Build M creature/page reveals (placeholder banners per Convention #204)** | N/A — library | Referenced by `reward_reveals.animation_ids UUID[]` (designed to attach 1+ reveal IDs per reward reveal config). Picked by `RewardRevealModal.tsx` placeholder ([line 314](src/components/reward-reveals/RewardRevealModal.tsx#L314): "For now, render a generic animation. Phase 4 or later can wire the named components"). |
| `reward_reveals` (migration 100143:25) | Family + creator | **THIS IS THE CLOSEST EXISTING JUNCTION SHAPE TO YOUR SWITCHBOARD VISION.** Mom's configured reveal combo: `name` (NULL=inline, non-NULL=named library entry), `animation_ids UUID[]`, `animation_rotation` ∈ `{sequential, random}`, `prize_mode` ∈ `{fixed, sequential, random}`, `prize_type` ∈ `{text, image, platform_image, randomizer, celebration_only}`, `prize_text/name/image_url/asset_key`, `prize_randomizer_list_id` (FK to lists), `prize_pool JSONB` (for sequential/random modes). 18 columns. | PRD-24 / addendum | **Schema-complete, RLS'd, hooks built (useRewardReveals.ts 601 lines), modal built (RewardRevealModal), library picker built (RewardRevealLibrary). 0 rows in production. No settings UI to create reveals. No completion hook fires it.** | One reveal can attach to N sources via `reward_reveal_attachments`. One source can have one active reveal per member (partial unique index). | Source-of-truth for reveal config. Designed to be looked up by `useRevealOnCompletion` on completion events. |
| `reward_reveal_attachments` (migration 100143:126) | reward_reveals + (`source_type`, `source_id`) | **THIS IS THE CLOSEST EXISTING JUNCTION ROW SHAPE.** Links a reveal to a completable source. `source_type` CHECK ∈ `{task, widget, list, intention, sequential_collection, sequential_interval, mastery}`. `source_id UUID NOT NULL`. `family_member_id` (NULL=all assignees, non-NULL=specific kid). `is_repeating BOOLEAN`. `reveal_trigger_mode` ∈ `{on_completion, every_n, on_goal}`. `reveal_trigger_n INTEGER`. `times_revealed INTEGER`, `last_revealed_at TIMESTAMPTZ`. UNIQUE on `(source_type, source_id, family_member_id) WHERE is_active=true`. | PRD-24 / addendum | **Schema-complete, hooks built. 0 rows in production. No settings UI to create attachments. No completion hook reads it.** | **One source → one reveal config (per member); one reveal config → many sources.** | The `useRevealOnCompletion()` hook ([useRevealOnCompletion.ts](src/hooks/useRevealOnCompletion.ts)) exists to read this on completion events. **Zero consumers — grep `useRevealOnCompletion` in src/ returns only the hook definition.** |
| `earned_prizes` (migration 100144:12) | Family member + reward_reveal_id + (`source_type`, `source_id`) | Snapshot of earned prizes when a reveal fires. `prize_type/text/name/image_url/asset_key/animation_slug` (snapshot of the reveal config at earn-time). `earned_at`, `redeemed_at`, `redeemed_by`. | PRD-24 / addendum | **Schema-complete, RLS'd, PrizeBox.tsx built. 0 rows in production. Only written when a reveal fires (which never happens today — see above).** | One prize per reveal-fire | Read by PrizeBox.tsx (Play shell only). Not read elsewhere. |
| `congratulations_messages` (migration 100143:230) | (Library) ~20 system rows + family-custom | Pre-seeded congrats message templates. Categories: `{general, milestone, streak, completion, effort}`. `{reward}` placeholder substitution. | PRD-24 / addendum | **Library wired (20 system rows); picker UI exists; consumer none — depends on reveal firing** | N/A | Read by CongratulationsMessagePicker.tsx in reveal flow. |
| `reward_redemptions` | (PRD-24 spec) | **Table doesn't exist in production.** PRD-24 ([PRD-24:871](prds/gamification/PRD-24-Gamification-Overview-Foundation.md#L871)) describes redemption flow with auto-approve and pending-approval branches. F58: 7 of 8 PRD-24 tables absent. | PRD-24 | **Missing — never built** | — | Would mediate "kid spends points → mom approves → reward delivered." |
| `treasure_boxes` / `treasure_box_opens` | (PRD-24 spec) | **Tables don't exist in production.** PRD-24 ([PRD-24:283-309](prds/gamification/PRD-24-Gamification-Overview-Foundation.md#L283)) describes treasure box widget with three trigger types: `points_threshold`, `count_based`, `completion_unlock`. | PRD-24 | **Missing — never built** | — | Would have been a connector consumer (a tracker-to-reveal-of-named-reward pattern). Build M's `member_creature_collection` + `member_page_unlocks` partially substituted but not fully. |
| `gamification_events` / `gamification_rewards` / `gamification_achievements` / `gamification_daily_summaries` | (PRD-24 spec) | **None of these tables exist in production.** PRD-24 calls them out as the event-log + reward-catalog + achievement-log + daily-rollup. | PRD-24 | **Missing — never built** | — | Would have been the canonical "what fired and when" log. Build M shipped without them; the 11-step RPC just does idempotent INSERTs on `member_creature_collection` instead. |

### 1.2 — Notes on multi-routing capability today

- **The only table in production that supports "one source → many destinations" multi-routing** is `reward_reveal_attachments` (one source can in theory have multiple active rows if `family_member_id` differs — partial unique index allows multi-member attachments). And it has 0 rows.
- Every other production wiring is hardcoded 1:1 in code — `roll_creature_for_completion` walks specific tables in a specific order; `awardOpportunityEarning` reads `task_rewards` for one specific case; victory creation is hardcoded in `Lists.tsx`.
- There is no "register a listener" or "subscribe a consumer" pattern anywhere in the codebase outside of pgmq embeddings.

---

## §2 — Build M conventions and what they actually shipped

### 2.1 — The 11-step `roll_creature_for_completion` RPC

Defined in [migration 00000000100115:1050-1356](supabase/migrations/00000000100115_play_dashboard_sticker_book.sql#L1050). SECURITY DEFINER. `RETURNS JSONB`. Called from 4 client-side hook sites with the standard `try { rpc('roll_creature_for_completion', { p_task_completion_id }) } catch { warn; return null }` pattern (per Convention #199 — never throws to caller).

**The 11 steps:**

1. **Step 1 — Load context.** Load `task_completions`, `tasks`, `family_members`, `gamification_configs`. Early-returns: `task_completion_not_found`, `task_not_found`, `family_member_not_found`, `gamification_disabled`.
2. **Step 2 — Idempotency check.** Look up `member_creature_collection.awarded_source_id = p_task_completion_id`. If found, return `{already_processed: true, new_point_total, new_streak}` without re-awarding. **This is the entire idempotency mechanism — there is no separate event log.**
3. **Step 3 — Filter by completion_type.** Only `'complete'` and `'mastery_approved'` proceed past this gate (per Convention #200). `'practice'` and `'mastery_submit'` early-return with `{skipped_completion_type: ...}`.
4. **Step 4 — Award points.** `points_to_award = COALESCE(tasks.points_override, gamification_configs.base_points_per_task)`. UPDATE `family_members.gamification_points`. **Append-only by code convention — there is NO decrement code path anywhere** (Convention #206).
5. **Step 5 — Update streak.** Naive consecutive-day check. Streak resets to 1 on any gap. **`streak_grace_used_today` column exists but RPC doesn't consume it** (Subagent C bug #4 — dormant grace logic).
6. **Step 6 — Sticker book gate.** Load `member_sticker_book_state`. Early-return `{points + streak only}` if `is_enabled=false`.
7. **Step 6 (cont.) — d100 vs roll chance.** Roll d100 against `creature_roll_chance_per_task` (default 40). Failed rolls early-return `{points + streak only}`.
8. **Step 7 — Pick rarity.** Read `rarity_weights JSONB` (defaults: common=85, rare=12, legendary=3). Roll d100, bucket into rarity tier.
9. **Step 8 — Pick a creature.** Random pick from `gamification_creatures WHERE theme_id = active_theme_id AND rarity = chosen_rarity AND is_active = true`. Falls through legendary→rare→common if higher tiers empty. Returns `{theme_empty: true}` payload if all tiers empty.
10. **Step 9 — Write creature award.** INSERT `member_creature_collection` with random position_x/y. Increment `member_sticker_book_state.creatures_earned_total`.
11. **Step 10 — Check page unlock.** ONLY supports `page_unlock_mode='every_n_creatures'` in this RPC. The migration 100126 added `every_n_completions` and `tracker_goal` modes, and the modal exposes them, but the RPC's Step 10 only branches on `every_n_creatures` (PRD-24 spec called for tracker_goal — flagged as misleading-UI in STUB_REGISTRY:267). On hit: pick next un-unlocked sticker page in `sort_order`, INSERT `member_page_unlocks`, UPDATE `active_page_id`.
12. **Step 11 — Return JSONB payload.** Single-call response with everything the client needs to coordinate animations: points, streak, creature record, page record.

**Migration 100126 added a "Step 7" earning-mode branch BEFORE the d100** — it switches between 4 creature_earning_modes (`random_per_task`, `every_n_completions`, `segment_complete`, `complete_the_day`) via helper RPCs (`check_segment_completion`, `check_day_completion`, `advance_coloring_reveal`). Coloring reveal advancement is checked FIRST when `earning_task_id` matches (per Convention #211).

### 2.2 — The 6-section settings modal

`GamificationSettingsModal` (Convention #221) has 6 collapsible sections:
1. Master toggles (enable gamification, sticker book, base points per task).
2. Day Segments (CRUD with DnD reorder, day-of-week filters, per-segment creature earning toggle).
3. Creature Earning (4-card mode picker).
4. Background/Page Earning (3-card mode picker).
5. Coloring Reveals (browse library, assign task, pick step count + lineart).
6. Reset & Advanced.

### 2.3 — F58: Build M baby-step scope cut

Per F58 evidence: PRD-24 originally specified 8 reward-economy tables. **7 of 8 are absent in production.** Only `gamification_configs` shipped (the master config — which Build M extended significantly).

Tables PRD-24 specced that are MISSING:
1. `gamification_events` — the canonical event log
2. `gamification_rewards` — reward catalog (named rewards mom configures)
3. `reward_redemptions` — redemption requests + auto-approve flow
4. `treasure_boxes` — configurable treasure box containers
5. `treasure_box_opens` — open log
6. `gamification_achievements` — earned badges/streaks
7. `gamification_daily_summaries` — daily rollup for DailyCelebration

**Six PRD-24 screens are also absent** per F58: Reward Menu, Treasure Box Widget, Treasure Box Reveal Modal (the production code uses the Build M sticker book reveal placeholders instead), Reward Redemption Flow screens (3+).

**What Build M substituted:**
- `member_sticker_book_state` + `member_creature_collection` + `member_page_unlocks` + `member_coloring_reveals` together replace the treasure-box-and-reveal half.
- `gamification_creatures` + `gamification_sticker_pages` + `coloring_reveal_library` replace the reward catalog half (but they're collectibles, not redeemables).
- **The redemption half (kid spends earned currency) was NOT replaced.** Gamification points are dead-end (Recon §3 confirmed; STUB_REGISTRY:244-249 confirms task-unmark cascade also unwired).

### 2.4 — Reusability assessment for the central switchboard

- **`roll_creature_for_completion` is hardwired to one input (a `task_completions.id`) and one output set (creature/page/coloring).** It cannot, as written, fire when an `intention_iteration` happens, when a `widget_data_point` lands, or when a `list_items.checked` toggles. To do that, every input would need either (a) parallel RPCs per source type, or (b) a generic event-keyed RPC that branches on source type.
- **The 4-hook fan-in pattern (Convention #198) is the actual switchboard today.** The four hooks all converge on this one RPC. That convergence is the operational connector layer — but it's hardcoded in JavaScript across 4 files, not in a junction table.
- **Idempotency-via-`awarded_source_id`** is reusable as a pattern but is currently keyed only on `task_completions.id`. A central switchboard that wanted to fire creatures on intention iterations would need a different uniqueness key or a parallel collection table.

---

## §3 — The reward-reveals/ parallel architecture

F61 names this as the open architectural question. Here's the ground truth on what each does:

### 3.1 — `reward-reveals/` (5 tables, migration 100142-100144)

**Purpose:** Mom-configured reveal animations + prize content, attachable to "any completable item."

**Tables:**
1. `reveal_animations` (33-34 rows) — platform library of animation clips/effects.
2. `reward_reveals` (0 rows in production) — mom's configured reveal combos.
3. `reward_reveal_attachments` (0 rows) — attaches a reveal to a source.
4. `congratulations_messages` (~20 system rows) — message template library.
5. `earned_prizes` (0 rows) — snapshot ledger of earned-but-unredeemed prizes.

**What it does today:**
- Schema is complete, RLS'd, indexed. Hooks built (601 lines in `useRewardReveals.ts`). Modal built (`RewardRevealModal`). Library browser built (`RewardRevealLibrary`). Provider built (`RewardRevealProvider`). Picker built (`RevealAnimationPicker`). Editor built (`PrizeContentEditor`). Attach UI built (`AttachRevealSection`). Prize Box UI built (`PrizeBox`). The `useRevealOnCompletion()` hook exists.
- **Zero settings UI to CREATE reveals (no /settings/reward-reveals page wired).**
- **Zero call sites for `useRevealOnCompletion()` in completion handlers** — grep returns only the hook definition, no consumers in any task/list/widget completion site.
- **Zero rows in production for reward_reveals, reward_reveal_attachments, earned_prizes.**
- PrizeBox renders only inside PlayRewards (Play shell only).

**Architecturally, this IS the closest existing thing to a connector layer:**
- `reward_reveal_attachments` is a junction row keyed by `(source_type, source_id, family_member_id)`.
- `source_type` CHECK already covers 7 producer types: `task, widget, list, intention, sequential_collection, sequential_interval, mastery`.
- `reveal_trigger_mode` already supports `on_completion`, `every_n`, `on_goal` patterns (so "every 50 mindful eye contact taps" is in the schema).

### 3.2 — `gamification/reveals/` (Build M sticker book + coloring + animation primitives)

**Purpose:** Reveal moments wrapping creature/page/coloring earning events from the gamification pipeline.

**Tables (Build M):**
- `member_creature_collection` (rolling collection)
- `member_page_unlocks` (unlock log)
- `member_coloring_reveals` (in-progress coloring reveals)
- `coloring_reveal_library` (32 Woodland Felt subjects)

**Components (per F8 — the "Lego primitive library"):**
- 9+ React components in `src/components/gamification/`: `TreasureBoxIdle`, `BackgroundCelebration`, `ReadabilityGradient`, `CardFlipReveal`, `ThreeDoorsReveal`, `SpinnerWheelReveal`, `ScratchOffReveal`, `PointsPopup`, `StreakFire`, `LevelUpBurst`, `StarChartAnimation`.
- All shipped as production-quality, shell-aware components.
- **All consumed only by `/dev/gamification` showcase page.** Zero production consumers (per F8: "intentionally unassigned to production consumers per Lego/surge-protector architecture").

**What Build M actually wires:**
- The RPC writes to the 4 Build M tables.
- Sub-phase C ships **placeholder banners** for creature/page reveals (Convention #204) — 2-second `<div role="status">` divs, NOT full-screen reveal modals.
- `CreatureRevealModal` and `PageUnlockRevealModal` are referenced in the modal queue but the components don't exist (Subagent E bug #1).

### 3.3 — Functionally duplicate or different cases?

**Different cases on paper, structurally similar.**

- **`reward-reveals/` is intended for any-source/any-prize.** It treats reveals as wrapping paper for prize delivery. The prize CAN be a creature image (`prize_asset_key`, `prize_type='platform_image'`), but it's typically a text reward (`prize_text`) or a custom photo prize.
- **`gamification/reveals/` is hardwired to creature/page rewards.** The animation library IS shared (`reveal_animations` is the same table both consume), but the consumption path is different — gamification reveals fire from the RPC and pull pre-defined creature/page rewards, while reward-reveals fire from `useRevealOnCompletion` on the completable source and pull mom-configured prizes.
- **Today they coexist without conflict because reward-reveals has zero consumers.** If reward-reveals were wired, they'd partially overlap with creature reveals on task completion (both could fire on the same `task_completions` row — one from the RPC, one from `useRevealOnCompletion`).

### 3.4 — If a switchboard fires "trigger a reveal" as a consumer action

- **`useRevealOnCompletion` is the ready-made hook** to call from a switchboard consumer dispatch site. It already takes `(sourceType, sourceId, memberId, familyId, completionCount)` and resolves through `checkRevealTrigger` → reads `reward_reveal_attachments` for matching active attachment → resolves animation + prize → pushes onto `RewardRevealProvider` queue.
- **The gamification pipeline (Build M sticker book) would NOT fold into a generic "trigger a reveal" consumer naturally** — it's coupled to creature inventory writes, page unlock checks, and earning-mode branching. A switchboard would more cleanly route to `useRevealOnCompletion` for reward-reveal-flavored reveals AND separately to `roll_creature_for_completion` (or its successor) for sticker-book-flavored reveals.

---

## §4 — `lists.reveal_type` and the Color Reveal subject system

### 4.1 — `lists.reveal_type` today

- **Defined in [migration 00000000000008:310](supabase/migrations/00000000000008_tasks_lists.sql#L310)** as a TEXT column. NULL in every row in production. F62 calls it "dormant column."
- **Zero readers in production code.** Grep `reveal_type` in src/ returns only `lists.victory_mode` references and `reveal_type` references in reveal_animations type definitions, NOT consumers of `lists.reveal_type`.
- **F61 designates `lists.reveal_type` as the wire-up point for the reveal library connector at build time.** The intent: a list's `reveal_type` would name which reveal animation (or which named `reward_reveals` row) fires when items are drawn from the list.

### 4.2 — The Color Reveal subject system

**32 Woodland Felt subjects in `coloring_reveal_library`** (migration 100126:88-110):
- 20 animals + 12 scenes
- Each row: `slug`, `display_name`, `subject_category` ∈ `{animal, scene}`, `theme_id` (Woodland Felt theme), `color_zones JSONB` (the coordinates and colors for each zone), `reveal_sequences JSONB`, `zone_count INTEGER` (defaults 50)

**`reveal_sequences JSONB`** stores 6 step-count variants per subject:
- Keys: `5`, `10`, `15`, `20`, `30`, `50`
- Each value is an array of zone-id arrays — defines which zones reveal at each step
- A subject with 50 zones might reveal 10 zones per step in the "5" variant, 5 zones per step in the "10" variant, etc.
- This gives mom 6 different "speed" choices when assigning a coloring reveal to a kid

**Asset URLs are NOT stored in DB** — they're computed at runtime as `{CDN_BASE}/gamification-assets/woodland-felt/coloring-library/{slug}/{file}` (Convention #213). DB stores only the slug.

### 4.3 — How color reveal operates today

- **1:1 task-linked tally counter** per Convention #211 (Build M baby-step simplification of PRD-24B Screen 10's broader vision).
- `member_coloring_reveals` row per active reveal: `coloring_image_id` FK to library + `earning_task_id` FK to a single task + `reveal_step_count` ∈ `{5,10,15,20,30,50}` + `current_step` counter + `revealed_zone_ids INTEGER[]`.
- Each completion of the linked task = one reveal step (one zone group transitions from grayscale to color).
- The RPC checks `earning_task_id` FIRST (priority over creature earning modes per Convention #211) — if matches, advances the linked reveal regardless of any other earning-mode logic.
- **It's a tally counter tied to a specific repeatable action, not earning-mode-driven.**
- 4 visible config fields per Convention #212 (DOC DRIFT — schema actually has 8 earning_* fields; Subagent E bug #4): pick image, pick linked task, pick step count, pick lineart preference.

### 4.4 — Connector-fit assessment

**Color reveal today is a self-contained system that does NOT fit the connector pattern naturally without rewriting:**
- Today's wiring is `(member, task)` — not `(member, source_type, source_id)`. The earning_task_id FK is tasks-only.
- F62 explicitly flags this as the rewrite scope: "I would like color reveal to also be able to connect to multiple tasks [click all that apply] or attach to streaks, book chapters, or any type of list etc. It would again be like a lego piece connector that mom can connect anywhere to anything..."
- The `reveal_sequences JSONB` per-subject library structure IS reusable. The advancement counter (current_step + revealed_zone_ids) is reusable. The 4-config-field UX could be reusable.
- What would NOT be reusable as-is: the single `earning_task_id` FK; the one-image-per-active-reveal-per-kid pattern (Convention #211 says a kid has ONE active member_coloring_reveals row at a time per image; the multi-source connector model would need a many-to-many).

---

## §5 — Best Intention iteration → reward path

### 5.1 — Today

- **`intention_iterations` table** (and `family_intention_iterations` for family-level intentions). One row per tap. PRD spec: append-only, no UPDATE/DELETE.
- **`useLogIntentionIteration`** ([useBestIntentions.ts:410](src/hooks/useBestIntentions.ts#L410)):
  1. INSERT iteration row (with optional `victory_reference TEXT` — free-form, NOT a FK).
  2. DB trigger `trg_increment_iteration_count` increments `best_intentions.iteration_count`.
  3. Fire-and-forget INSERT to `activity_log_entries` with `event_type='intention_iterated'` + `source_table='intention_iterations'`.
  4. Invalidate React Query caches.
- **No reward path. No gamification path. No victory path.** Convention #1 / PRD-11 specifies AIR for intention iterations → silent victory — not implemented.
- The `victory_reference` column on `intention_iterations` is a free-form TEXT note (typically `"Victory recorded"` if user manually claimed one), NOT a structured link.

### 5.2 — Schema fitness for switchboard source

- **`intention_iterations.id` could serve as a source_id** in a switchboard junction (`source_type='intention_iteration'`). The shape works.
- **`family_id`, `member_id`, `intention_id`, `day_date`, `acted_by` are all already populated.** Sufficient for routing decisions.
- **No `is_milestone` or threshold-met flag exists.** A "every N iterations" trigger would have to be computed by reading current `iteration_count` after INSERT (the increment trigger guarantees a fresh read).

### 5.3 — `tasks.related_intention_id` half-wired column

- Column exists (PRD-09A schema, [migration 100023](supabase/migrations/00000000100023_tasks_prd09a_full.sql)).
- Type definition in `src/types/tasks.ts:313`.
- **Zero writers in src/ — grep returns only the type definition.**
- **Zero readers anywhere.**
- **Removing the column would not break anything in current code.** It's a true stub socket — present for "future PRD-06 ↔ PRD-09A linkage" per the PRDs but never wired.

---

## §6 — Victory Recorder integration points

### 6.1 — Programmatic victory creation API

`useCreateVictory()` ([useVictories.ts:188](src/hooks/useVictories.ts#L188)) — single mutation hook, accepts `CreateVictory` type, INSERTs one `victories` row, invalidates 4 cache keys. No special permissions needed beyond standard family RLS. **This IS the canonical API and could be called from any generic event handler.**

### 6.2 — Current call sites (to assess switchboard fit)

| Call site | Trigger | Notes |
|---|---|---|
| `RecordVictory.tsx` | Manual UI form submit | Direct user action |
| `VictorySuggestions.tsx` ([line 73](src/components/victories/VictorySuggestions.tsx#L73)) | After `scan-activity-victories` Edge Function (Haiku) returns suggestions and user taps Claim | User-initiated scan-then-claim |
| `Lists.tsx` ([line 1500-1540](src/pages/Lists.tsx#L1500)) | Inline on list item check / list complete (only when `victory_mode` allows) | Hardcoded inline insert; idempotent guard via existence check on `(family_id, family_member_id, source, source_reference_id)` |
| `MonthlyReviewCard.tsx` | Periodic rhythm review → manual selection | User-initiated |
| `commitMindSweepLite.ts` | MindSweep-Lite disposition routes to victory | User-confirmed routing |
| `useNotepad.ts` | Notepad → Victory routing | User-confirmed routing |
| `NotepadReviewRoute.tsx` | Review & Route → Victory | User-confirmed routing |
| `useMindSweep.ts` | MindSweep classification routes to victory | User-confirmed routing |
| `useSpotlightSearch.ts` | Spotlight search action | User-initiated |

**`useCreateVictory` is generic and could be called from any switchboard consumer. No source-specific logic gates it.**

### 6.3 — AIR (Automatic Intelligent Routing) — designed but not built

PRD-11 specifies silent auto-creation of victories on three trigger types:
- Task completion ([PRD-11:414](prds/personal-growth/PRD-11-Victory-Recorder-Daily-Celebration.md#L414))
- Best Intention iteration ([PRD-11:416](prds/personal-growth/PRD-11-Victory-Recorder-Daily-Celebration.md#L416))
- Widget milestone ([PRD-11:417](prds/personal-growth/PRD-11-Victory-Recorder-Daily-Celebration.md#L417))

**Per audit Finding B (cited in [AUDIT_REPORT_v1.md:215](claude/web-sync/AUDIT_REPORT_v1.md#L215)): all 3 designed AIR sources lack writer code.** The list-completion auto-victory ([Lists.tsx:1500](src/pages/Lists.tsx#L1500)) is a separate inline pattern, NOT AIR.

STUB_REGISTRY confirms:
- "Auto-victory from task completions ⏳ Unwired (MVP)" — call commented out at `useTaskCompletion.ts:106-108` with `(stub — PRD-11)` marker
- "Victory Recorder logging from intentions ⏳ Unwired (MVP)" — `useLogIntentionIteration` writes iteration + activity_log; no victory insert
- "Widget milestone → victory ✅ Wired Phase 12" — **STUB_REGISTRY says wired; F58 evidence says NOT wired; recon doc says NOT wired.** This is a known false-positive in STUB_REGISTRY (registry drift).

### 6.4 — Family Victory Recorder (PRD-11B)

**Missing entirely.**
- `family_victory_celebrations` table doesn't exist (live_schema.md confirms).
- Zero src/ implementations (grep returns only test/audit doc references).
- Feature keys not in `feature_key_registry` (`family_celebration_basic`, `family_celebration_detailed`, `family_celebration_voice`, `family_celebration_archive`).
- STUB_REGISTRY:120 falsely claims "Wired Phase 12" — confirmed false in F19 evidence.
- PRD-11B exists as a spec; no schema, no UI, no hooks.

### 6.5 — Switchboard fit

- **For individual victories:** `useCreateVictory` is a clean, generic, programmatically-callable destination. A switchboard could fire it from any consumer with `(family_id, family_member_id, description, source, source_reference_id, importance)`.
- **For family victories:** Would require building PRD-11B from scratch first.

---

## §7 — Allowance system as a consumer

### 7.1 — Data flow today

```
Task completion (any source)
    ↓
INSERT task_completions row (or routine_step_completions row for routine sub-steps)
    ↓
calculate_allowance_progress(member_id, period_start, period_end, grace_days_jsonb) RPC
    ↓ Reads LIVE from:
    - tasks (assignee_id + counts_for_allowance + is_extra_credit + allowance_points + recurrence_details)
    - task_completions (period_date filter, dedup'd)
    - routine_step_completions (period_date + (step_id, period_date, family_member_id) dedup)
    - allowance_configs (calc approach, thresholds, grace settings)
    - allowance_periods.grace_days JSONB (per-day grace_mode array)
    ↓
Returns 20-column structured result: completion %, base, calculated, bonus, extra credit split, grace days excluded
    ↓
Live widget reads this on every render. NO write happens until period close.
    ↓
Period close (cron-invoked Edge Function calculate-allowance-period):
    - Loops every active allowance_configs
    - Computes period dates per family timezone
    - Reads RPC result
    - INSERTs financial_transactions row (transaction_type='allowance_earned')
    - Closes the allowance_period row
    - Opens next period via trigger trg_set_allowance_period_dates
```

### 7.2 — Single RPC vs embedded logic

**The flow goes through `calculate_allowance_progress` RPC** as the canonical source of truth (per Convention NEW-W dispatch note 2026-04-23). The Edge Function reads this RPC; the live widget reads this RPC; the Preview panel reads this RPC. **Three readers, one math source.**

**Forward write to `financial_transactions`** happens in two places:
1. `calculate-allowance-period` Edge Function at period close (allowance_earned).
2. `awardOpportunityEarning()` helper in [useTasks.ts:99](src/hooks/useTasks.ts#L99) on opportunity task completion (opportunity_earned).

**No event bus.** No "routine completed → emit event → consumer listens." Just direct hardcoded reads at two specific moments.

### 7.3 — "Counts AND fires other connector events" capability today

- **`tasks.counts_for_allowance BOOLEAN` is a flag, not a routing config.** It just makes the RPC consider this task in the denominator/numerator.
- **`tasks.counts_for_homework BOOLEAN` is a parallel flag** (PRD-28 sub-phase B) — same pattern, different consumer (`homeschool_time_logs`).
- **`tasks.counts_for_gamification BOOLEAN` is a third parallel flag** (Convention #224 / migration 100170).
- **A task can have all three flags set** — completion fires gamification (RPC) AND counts toward allowance (RPC reads it live) AND auto-creates `homeschool_time_logs` row (inline in `useCompleteTask` lines 463-487).
- **But the wiring is hardcoded at the completion site for each consumer.** Not a routing config — three independent flag-checks in code.

### 7.4 — IOU / "money owed" today

- **Money owed = current `financial_transactions` running balance.** Computed via `calculate_running_balance(member_id)` RPC (sums all transactions).
- **No separate IOU table.** Mom marks paid by INSERTing a `payment_made` transaction (negative amount).
- **`FinancesTab.tsx`** (mom-only inside `/tasks`) shows "What I Owe" per child computed from running balance.
- **No kid-facing redemption store** — kids see their balance, mom delivers payment offline.

### 7.5 — Opportunity earnings (separate pool)

- **Same `financial_transactions` ledger**, but `transaction_type='opportunity_earned'` (different from `allowance_earned`).
- **Different code path:** `awardOpportunityEarning()` writes immediately on completion (with task `task_type LIKE 'opportunity_%'` AND `task_rewards.reward_type='money'`), NOT at period close.
- **Idempotent via `uq_financial_transactions_forward_per_completion` partial unique index** (migration 100174).
- **Reverse RPC `reverse_opportunity_earning(p_completion_id)`** writes negative `adjustment` rows on uncomplete (NEW-HH).
- **Same payment workflow:** mom marks paid via `payment_made` transaction; same balance math.

---

## §8 — Points system today

Per recon §3 there are at least three "points" concepts. Confirmed:

### 8.1 — `gamification_points` (the display counter)

- **Storage:** `family_members.gamification_points INTEGER`. Single counter per kid.
- **Earned:** RPC step 4 — `points_to_award = COALESCE(tasks.points_override, gamification_configs.base_points_per_task)`. UPDATE the column.
- **Spent:** **Nowhere.** Append-only by code convention. No decrement code path anywhere in src/ or supabase/.
- **UI surface:** `PlayDashboardHeader` stat pill (labeled "Stars" when `dashboard_mode='play'` per `gamification_configs.currency_name`); Guided/Independent dashboards show as numeric counter.
- **Status:** Dead-end currency.

### 8.2 — "Special Privilege" rewards (`task_rewards.reward_type='privilege'`)

- **Storage:** `task_rewards.reward_value JSONB` (typically `{text: "extra screen time"}`).
- **Earned:** Mom captures at task creation. **Display only on the task card.**
- **Spent / delivered:** **No code path** — no consumer reads `reward_type='privilege'` rows. Mom delivers offline.
- **No mom queue, no audit trail, no "outstanding privileges" surface.**
- **Status:** Dead-end (Recon §3 calls this out as a compliance gap, Subagent F section 9).

### 8.3 — `task_rewards.custom_via_task` — actually `reward_type='custom'`

- The recon's "custom_via_task" name doesn't match a column; the actual column is `task_rewards.reward_type='custom'`. Same dead-end pattern.
- `reward_value JSONB` typically holds `{text: "...", photo_url: "..."}`.
- **No reader in production code for `reward_type='custom'`.** PrizeBox only renders `earned_prizes` (which only get written by reward_reveals path, not by direct `task_rewards`).
- **Mom sets a custom reward inline on a task → kid sees the promise on the card → kid completes → no PrizeBox row created → mom forgets** (this is recon §4.4 defect).
- **Status:** Dead-end with discoverability defect.

### 8.4 — `reward_reveals` infrastructure (the closest thing to a redemption surface, but no spend mechanism)

- `earned_prizes.redeemed_at` + `redeemed_by` form a redemption record. Mom can mark redeemed via PrizeBox.tsx.
- **But no row ever lands in `earned_prizes` because the reveal pipeline isn't wired.**
- Even if it were, this is "mom delivers a one-shot prize" not "kid spends accumulated points."

### 8.5 — Allowance Points (different concept entirely — `tasks.allowance_points`)

- Per-task INTEGER **weight** for the points-weighted allowance calculation. NOT a thing the kid earns.
- Used as numerator weight when `allowance_configs.calculation_approach='points_weighted'`.

### 8.6 — Spend mechanism today

**None of the three points concepts has a spend mechanism in production.** No table, no hook, no UI accepts "kid spends X points → Y happens." The PRD-24 spec calls for `reward_redemptions` (auto-approve and pending-approval branches) — never built.

---

## §9 — Three-layer inheritance — what already exists

The "family default → kid override → primitive override" pattern exists in TWO places today:

### 9.1 — `homeschool_configs` (canonical implementation, Convention #226)

- **Schema pattern:** `family_member_id UUID NULL`. NULL = family-wide default, non-NULL = per-child override.
- **Two partial unique indexes** (migration 100136):
  - `idx_hc_family_default ON (family_id) WHERE family_member_id IS NULL` — one family default per family
  - `idx_hc_child_unique ON (family_member_id) WHERE family_member_id IS NOT NULL` — one config per child
- **Resolution order (per Convention #226):** child override (if field non-NULL) → family default (if field non-NULL) → system default. Most fields are nullable on the override row so unset fields fall through to family default.
- **Most families configure once at family level; per-child overrides only when needed.**

### 9.2 — `allowance_configs` (similar but NOT identical pattern)

- **Schema pattern:** One row per kid (`UNIQUE INDEX idx_allowance_configs_member ON family_member_id`).
- **NO family-default row.** Every kid has their own config row from the moment allowance is enabled.
- **Bulk Configure modal (NEW-SS)** added a workflow to apply settings across multiple kids in one modal save — but that's a UX layer, not schema-level inheritance.
- **`allowance_periods` belongs to one kid only** (no family-wide rollup at the periods table level).

### 9.3 — `gamification_configs` (per-kid only)

- **One row per kid.** No family default row.
- **`auto_provision_member_resources` trigger** (migration 100115) inserts shell-appropriate defaults at member creation. That's the "family default" approximation — the trigger code is the source of truth, not a database row.

### 9.4 — Pattern consistency

- **Inconsistent across features.** `homeschool_configs` is the only true "family default + per-child override" schema. Others substitute trigger-injected defaults or per-kid-only rows.
- **No pattern is reusable as-a-helper today.** Each feature reimplements either the resolution logic (homeschool fields fall through to family default in JS) or the bulk-write (Bulk Configure modal).
- **Convention #226 is the only documented pattern.** It's narrowly scoped to homeschool_configs.

---

## §10 — Action event firing — current state

### 10.1 — Generic completion event today: NONE

**Tasks do NOT fire any kind of generic completion event.** What happens on task completion is hardcoded inline in `useCompleteTask` ([useTasks.ts:380+](src/hooks/useTasks.ts#L380)):
1. INSERT `task_completions` row.
2. UPDATE `tasks.status` + `completed_at`.
3. Inline call to `rollGamificationForCompletion(completion.id)` (RPC).
4. Inline call to `awardOpportunityEarning(completion.id)` (helper).
5. Inline INSERT to `homeschool_time_logs` if homework-flagged.
6. Return for client invalidation.

**Same pattern at `useApproveTaskCompletion` and the legacy approval hooks** — each one repeats steps 3, 4, and the appropriate cache invalidations.

### 10.2 — Same question for other producers

| Producer | Fires generic event? | What happens |
|---|---|---|
| Best Intention iteration | No | INSERT `intention_iterations` + DB trigger increments count + fire-and-forget `activity_log_entries` insert. No reward path. No victory path. |
| Widget data point (`widget_data_points`) | No | INSERT row. No downstream consumers fire. No AIR victory. PRD-10 spec says they should. |
| List item completion | No | INSERT `list_items.checked=true`. Inline check in [Lists.tsx:1500](src/pages/Lists.tsx#L1500) — IF `victory_mode` allows AND `victory_flagged`, inline INSERT into `victories`. No other consumer. |
| Routine step completion | No (kind of) | INSERT `routine_step_completions`. Read live by `calculate_allowance_progress` RPC. No event fires; consumers just re-read on demand. |
| Task completion | No | See §10.1 above — hardcoded inline calls to specific RPC + helper functions. |

### 10.3 — Existing event/queue/pub-sub patterns in the codebase

**Three exist; only one is used in production at any scale:**

1. **pgmq embedding queue** (CLAUDE.md, ai_patterns.md):
   - INSERT/UPDATE on tables with `embedding` columns triggers `util.queue_embedding_job()` which enqueues to pgmq.
   - `pg_cron` polls every 10 seconds → `embed` Edge Function processes batch.
   - **This is the only pgmq usage in production.** 1 queue, 1 consumer.
   - **It's batch-oriented and async** — NOT what you'd want for a synchronous switchboard.

2. **CustomEvent dispatch from `useTimer.ts`** (PRD-36):
   - `time_session_completed` and `time_session_modified` CustomEvents dispatched at three sites in the timer hook.
   - **Per F12 (audit): zero listeners exist anywhere.** "Timer events are dispatched to void."
   - PRD-36 addendum intent: loose coupling so downstream gamification/activity-log/analytics can listen independently. Never wired.

3. **`activity_log_entries` table writes as a soft event log:**
   - Tables: `activity_log_entries` (140 rows in production).
   - Many hooks fire-and-forget INSERTs with `event_type` strings: `'intention_iterated'`, `'task_completed'`, `'task_unmarked'`, `'special_adult_activity'`, etc.
   - **Read-only by `scan-activity-victories` Edge Function** (Haiku scan-then-claim flow for VictorySuggestions).
   - **No reactive consumers, no triggers, no subscriptions.** Pure write-and-occasionally-scan log.

### 10.4 — Switchboard fit summary

- **No existing event bus in the codebase that a switchboard could subscribe consumers to.**
- **pgmq is wrong shape** — embedding-style batched async polling, optimized for cost-of-AI-call deferral, NOT for sub-second reward routing.
- **`activity_log_entries`** is closest to "everything that happens gets logged with a typed source," but it's not reactive.
- **`useRevealOnCompletion`** is the closest thing to a "consumer subscribes to a producer event" pattern — but it requires the caller to manually invoke it on every completion site (and zero callers do today).
- **The `(source_type, source_id)` polymorphic key already appears in 4+ tables** today: `reward_reveal_attachments`, `earned_prizes`, `notifications` (`source_type` + `source_reference_id`), `activity_log_entries` (`source_table` + `source_id`), `family_requests`, `studio_queue`. **There's a de-facto convention for polymorphic source addressing** even though there's no junction-table connector.

---

## §11 — Audit Triage rows that touch the connector layer

Beyond F58, F61, F62 — every row from `AUDIT_REPORT_v1.md` and `TRIAGE_WORKSHEET.md` that intersects with reward/connector/lego architecture:

| Row | Title | What it says | Connector relationship | Recommendation context |
|---|---|---|---|---|
| **SCOPE-2.F58** (Row 65) | PRD-24 reward economy unbuilt — near-term lego-piece connector | 7 of 8 PRD-24 tables absent; 6 screens absent; founder direction "lego piece that plugs into any/all relevant lists, tasks, routines, best intentions, goals, etc." | **Direct hit** — this IS the connector layer scope. ESCALATED-priority annotation deferred to worker dispatch. | **Locked Fix Next Build / separate worker.** Independent of NEW-AA bundle and F60c. |
| **SCOPE-2.F61** (Row 68) | PRD-24B reveal library needs cross-feature lego wiring | 4 CSS/SVG reveals + 4 micro-celebrations + StarChartAnimation + TreasureBoxIdle + ReadabilityGradient consumed only by `/dev/gamification`. RewardRevealModal placeholder comment is the explicit hook point. **Open architectural question: reward-reveals/ parallel architecture — merge or coexist.** | **Direct hit** — names the open question of reward-reveals/ vs gamification/reveals/ unification; declares lists.reveal_type as the wire-up point. | **Locked Fix Next Build / bundled into NEW-AA worker.** Pre-build architectural reconciliation decision required. |
| **SCOPE-2.F62** (Row 69) | PRD-24B Color Reveal needs fuller lego-connector architecture | Build M's 1:1 task-linked tally counter is baby-step simplification. Founder: "color reveal to also be able to connect to multiple tasks, attach to streaks, book chapters, or any type of list etc." | **Direct hit** — explicitly extends color reveal to be a connector consumer. | **Locked Fix Next Build / bundled into NEW-AA worker.** Conventions #211–213 amendment/retirement when shipped. |
| **SCOPE-3.F30** (Row 83) | PRD-24B superseded architectures: flat Reveal Type Library → reveal_animations style_category + Color-Reveal → Build M tally-counter + animation primitives demo-only | PRD-24B's flat 8-ID library pivoted to 33 themed variants; PRD-24B's earning-mode-driven Color-Reveal pivoted to Build M's 1:1 tally counter. | **Adjacent** — supersession doc work; the underlying reveal architecture pivot relates directly to the connector design. | **Locked Fix Next Build / FOLDED into NEW-AA worker** (4-row scope: NEW-AA + F30 + F61 + F62). |
| **NEW-AA** (Row 32) | Reveals as universal presentation wrappers; reveal-as-task-presentation connector formalized across PRD-24 family | Composition Architecture §1.3: reveals can wrap any item-resolution event, not just reward delivery. Universal wrapper concept. | **Direct hit** — names reveals as the universal presentation wrapper for any consumer event. | **Locked Fix Next Build — NEW-AA worker scope.** Pre-build architectural decision required. |
| **SCOPE-2.F60c** (Row 67) | PRD-24A themes + game modes + Game Modes Addendum tables on active roadmap | 5 visual themes + 7 game modes + Game-Modes-Addendum tables (`boss_quests`, `bingo_cards`, `evolution_creatures`, `passport_books`) + LiLa generation. | **Adjacent** — game modes are downstream of the connector architecture (each game mode is a reveal/reward consumer pattern). | **Locked Fix Next Build / separate worker, sequences AFTER NEW-AA worker lands.** |
| **SCOPE-3.F8** (Row 174) | Reusable animation/visual primitive library intentionally unassigned to production consumers (Lego/surge-protector architecture) | 9+ visual primitive components in `src/components/gamification/` — production-quality, demo-only. | **Direct hit** — these are the visual building blocks the connector layer would consume. | **Locked Intentional-Update-Doc.** Lego documentation pass. |
| **SCOPE-3.F12** (audit row) | PRD-36 time_session_completed + time_session_modified events have zero listeners | Timer CustomEvents dispatched to void. PRD-36 addendum intent: loose coupling so downstream gamification hooks can listen. | **Direct hit on event-firing pattern** — timer events are the cleanest existing "producer fires generic event" pattern in the codebase, but no consumers exist. | **Locked Fix Next Build.** Wire to Build M gamification pipeline. |
| **SCOPE-3.F11** (audit row) | PRD-24 useUncompleteTask stub comment stale post-Build-M | Convention #206 acknowledges task-unmark cascade gap. Stub comment references "when PRD-24 is built" but Build M shipped. | **Adjacent** — the unmark cascade is the reverse-direction switchboard concern. | **Locked Fix Next Build.** Comment hygiene scope. |
| **SCOPE-3.F14** (Row 9) | PRD-28 first allowance_periods row never created (allowance non-operational at first-use) | Bootstrap gap. **RESOLVED 2026-04-24 by Worker B1a** (migrations 100163 + 100164). | **Adjacent** — allowance is a switchboard consumer; bootstrap matters. | RESOLVED. |
| **SCOPE-3.F28** (audit row) | PRD-24 integration edges schema/primitive-only | PRD-24 integration edges are schema/primitive-only consistent with Build M pivot. | **Adjacent** — names the gap between intended-consumer wiring and current schema-only state. | Locked Fix Next Build. |
| **SCOPE-3.F29** (Row 81) | PRD-24A overlay-engine architecture entirely superseded by Build M | All 9 PRD-24A overlay tables don't exist. Build M Sticker Book substitutes via different data model. | **Adjacent** — supersession context. | Locked Intentional-Update-Doc. |
| **SCOPE-3.F6** (Row 92) | PRD-24 family Cross-PRD Impact Addenda pre-Build-M, never back-amended | Addenda predate Build M and don't reflect current architecture. | **Adjacent** — doc hygiene. | Locked Intentional-Update-Doc. |
| **NEW-WW** (Row 202) | Per-line-item reward picker on opportunity lists + single opportunity tasks (shared component) | Founder request: per-item reward picker (Type → Money/Points/Extra Credit/Custom + Custom = text + photo) → reveal wrapper opt-in → deploy entire list OR per-item-deploy. | **Direct hit on connector consumer UX** — names the cascade picker as a shared component; cross-refs NEW-YY (points categorization), NEW-AA (reveals universal), NEW-NN (forward write — shipped). | **Locked Fix Next Build.** Beta=Y. |
| **NEW-XX** (Row 203) | Tracker money-source differentiator — breakdown by transaction_type on widget | Founder request: surface a breakdown showing where upcoming earnings come from (allowance percentage payout, opportunity earnings, extra credit, manual adjustments). | **Adjacent on consumer surface** — points at the mismatch between "everything fires into financial_transactions" and "kid wants to see what's coming from where." | Locked Fix Next Build. Beta=Y. |
| **NEW-YY** (Row 204) | Points categorization — separate pools (reading vs chore) so cross-category swap doesn't break intent | Refines NEW-QQ. Each earn pathway bound to a category; each redemption pool bound to one or more categories. | **Direct hit on connector design** — names the multi-pool routing problem. Folds into NEW-QQ post-Gate-2 flagship. | Locked Fix Next Build. Beta=N (post-Gate-2 flagship). |
| **NEW-QQ** (Row 196) | Points as a first-class Lego piece in Composition Architecture | Member `points_balance` ledger (append-only); earn pathways (task completion, opportunity completion, milestone hit, custom); spend pathways (reward redemption, privilege unlock, savings goals); cross-redeem (one balance funds many systems). | **Direct hit on connector design** — names points as a primitive in the Composition Architecture, not just an allowance numerator weight. | **Partially RESOLVED 2026-04-24** (discoverability gap closed via TaskCreationModal field exposure). Full points-as-primitive flagship deferred. |
| **NEW-G** (Row 28) | Opportunity Board dissolves into Lists page; is_opportunity is list-level | Convention 70 amendment. Lists page primitive spec. | **Adjacent** — the consumer surface (Lists page) for opportunity-flavored connector consumers. | Locked SPLIT — fast commit + bundled w/ PRD-09B worker. |
| **NEW-T** (Row 43) | Linked list items connector (item-level, analogous to linked-routine-step) | Doc §1.3 — list items can be linked to other primitives. | **Adjacent** — connector pattern at the item level. | Locked Fix Next Build / bundled w/ PRD-09B worker. |
| **NEW-I** (Row 102) | Person-pick-spin per-deploy config (flow A person-first / flow B reward-first) | Reveals the person-routing dimension of reveal connectors. | **Adjacent** — connector dimension (who receives the result). | Locked Fix Next Build / bundled w/ PRD-09B worker. |
| **NEW-N** (Row 38) | is_milestone property + Milestone Map surface (universal, Level 1 witnessed + Level 2 completion receipts) | Universal flag across 8 PRDs. Milestone Map is downstream consumer. | **Adjacent** — milestone-flag-to-Milestone-Map is one of the named connectors in the Composition Architecture doc. | Locked Fix Next Build. Single worker w/ shared-language preamble. |
| **NEW-O** (Row 39) | tracking_tags property + Finished Products composition pipeline | Cross-cutting tagging that routes to PRD-28B finished products. | **Adjacent** — tracking-tag-to-finished-product is another named connector. | Locked Fix Next Build. |
| **SCOPE-3.F31** (Row 168) | PRD-28 enum + compliance bundle (PRD-28B handoff + hourly + financial_approval dead enum values + homework approval) | Dead enum values to prune, given new RPC architecture. | **Adjacent** — financial-adjacent cleanup. | Locked Fix Next Build. |

**Summary on bundling:** F58 is locked as a separate worker (independent reward-economy build). F61 + F62 + F30 + NEW-AA bundle as the "NEW-AA worker" (4 rows). F60c is its own worker after NEW-AA lands. NEW-WW is its own worker. NEW-QQ + NEW-YY are the post-Gate-2 flagship for points-as-primitive. **A central switchboard connector layer would naturally sit at the intersection of F58 + NEW-AA bundle + NEW-QQ flagship — no current worker scope encompasses all three.**

---

## §12 — Surprises, contradictions, and things the founder might be misremembering

### 12.1 — Plain-English surprises

Here are the things in the ground truth that are most likely to change your mental model versus what you've been working from:

**1. The closest-existing connector is `reward_reveal_attachments` — and the architecture is well-designed.** The schema already has `(source_type, source_id, family_member_id)` as a polymorphic key, the source_type CHECK already covers 7 producer types, and `reveal_trigger_mode` already supports `on_completion / every_n / on_goal`. **The hooks, modal, library browser, picker, editor, and prize box are all built.** What's missing is a settings UI to create the rows, and any caller of `useRevealOnCompletion()`. This is much closer to your switchboard vision than the recon doc framed.

**2. Build M's RPC is monolithic, not extensible.** It walks 11 fixed steps for one specific input shape. It cannot fire on intention iterations or widget data points without significant refactor. **The 4-hook fan-in pattern (Convention #198) is the ACTUAL switchboard today — it lives in TypeScript across 4 files, not in the database.** When you redesign, you're not extending an existing connector layer; you're potentially replacing the RPC's input contract entirely.

**3. Best Intentions have richer existing infrastructure than you might think — but no reward path at all.** `intention_iterations.victory_reference TEXT` is a free-form note, NOT a structured FK. There's no DB-level connection between an iteration and any reward primitive. The "50 mindful eye contact taps → spa visit IOU" use case requires either (a) a counter trigger on `iteration_count` that fires a switchboard event, or (b) an attached `reward_reveal_attachments` row with `reveal_trigger_mode='every_n', reveal_trigger_n=50` — option b ALREADY EXISTS in the schema, but `source_type='intention'` is in the CHECK.

**4. `tasks.related_intention_id` is true dead code.** It exists as a column. Zero writers, zero readers, zero UI. Removing it would break nothing. The PRD-09A/PRD-06 "linkage" it was meant to provide doesn't exist.

**5. The reward-reveals infrastructure is architecturally already a junction-table connector, but every consumer is missing.** This is different from "the connector layer doesn't exist." It's "the connector layer exists in 5 tables and ~1000 lines of TypeScript hooks/components, but no producer fires it and no settings UI lets mom configure it." If you wanted to validate the switchboard design, you could likely make the existing `reward_reveal_attachments` work as your connector with minimal schema work — the bigger lift is wiring producers.

**6. The recon doc's "5 earning streams + 6 reveal animations as wrapping paper" framing matches code reality, but understates the connector capability already in `reward_reveal_attachments`.** The recon doc characterizes reveal animations as "wrap reward delivery" — but the schema already supports source_types far beyond rewards (intention iterations, sequential collections, sequential intervals, mastery events).

**7. There is no event bus in the codebase.** pgmq is for embeddings only. CustomEvents from useTimer go to void. activity_log_entries is a passive log read by one Haiku scan function. **Any switchboard you design would be the first reactive subscription pattern in the codebase.** That's a significant architectural commitment, not a "let's reuse what's there" choice.

**8. Three "points" concepts are NOT the same column.** The recon got this right but it's worth re-emphasizing: `family_members.gamification_points` (display counter, dead-end), `tasks.points_override` (per-task gamification award override), and `tasks.allowance_points` (per-task numerator weight for points-weighted allowance calculation). They're three different columns serving three different purposes; the only thing they share is the word "points" in the schema.

**9. Stars is just a label — confirmed.** `gamification_configs.currency_name` is the only difference between Stars and Points. Same `family_members.gamification_points` column underneath. There is no Stars table, ledger, or earning path independent of gamification_points.

### 12.2 — Contradictions in the docs

**1. STUB_REGISTRY:118 says "Widget milestone → victory ✅ Wired Phase 12" — F58 evidence and recon both confirm it's NOT wired.** The widget milestone AIR was never built. STUB_REGISTRY has a stale registry entry.

**2. STUB_REGISTRY:120 says PRD-11B Family Celebration "Wired Phase 12" — F19 confirms it's MISSING ENTIRELY.** Same registry-drift pattern.

**3. CLAUDE.md Convention #212 says coloring reveals have "4 fields only" — schema actually has 8 earning_* fields.** Documentation drift, not a functional bug (Subagent E bug #4). The convention text predates schema migrations that added the extra fields.

**4. PRD-09A:1026 specifies `task_rewards` with `reward_amount DECIMAL`, `bonus_threshold INTEGER`, `bonus_percentage INTEGER` — actual table only has `reward_value JSONB`.** The richer schema was never built; the JSONB stub is what shipped.

**5. PRD-11 specifies AIR for task completions, intention iterations, AND widget milestones — none of the three are wired.** STUB_REGISTRY:69 acknowledges this; STUB_REGISTRY:118 contradicts itself by claiming widget milestone wired.

**6. `lists.reveal_type` column exists in the live schema (migration 00000000000008:310) but is NOT mentioned in `claude/live_schema.md`** — review the live_schema dump file; the migration text shows the column.

**7. The `door_open` reveal seeded in migration 100142 has `css_component='DoorOpenReveal'` but `DoorOpenReveal.tsx` does not exist in src/.** Subagent E bug #3 — silent failure if the reveal ever triggered.

**8. `reward_reveal_attachments.source_type` CHECK doesn't include `task_completion` or `routine_step_completion` — only the parent types `task`, `widget`, `list`, `intention`, `sequential_collection`, `sequential_interval`, `mastery`.** If your switchboard wants to attach reveals to specific completion events (vs. the parent task), the CHECK needs updating.

### 12.3 — Things the founder might be misremembering

**1. "Build M shipped the reward economy."** Build M shipped the SUBSET of PRD-24 that covers sticker books + creature collection + coloring reveals + earning-mode strategies. **It did NOT ship the reward economy** (gamification_rewards, reward_redemptions, treasure_boxes, treasure_box_opens, gamification_events, gamification_achievements, gamification_daily_summaries are all missing). F58 is explicit about this.

**2. "We have a reveal library."** Yes (33-34 reveal_animations rows in production), AND **a separate parallel reward-reveals architecture (5 tables, 1 of which has data) that wraps reveals with prize content and attachments.** When founder says "the reveal library" she might mean either — they're different things wired differently.

**3. "Best Intentions can already attach rewards."** No. There is zero reward path on `best_intentions` or `intention_iterations` today. The schema doesn't have a column for it. The 50-iterations-then-spa-visit example would require entirely new wiring.

**4. "Widget milestones auto-create victories."** Per Convention #1 / PRD-11 / STUB_REGISTRY:118 — they should. Per F58 evidence + recon + grep — they don't. The "✅ Wired" stub registry entry is wrong.

**5. "Points and Stars are separate currencies."** No — they're the same `family_members.gamification_points` column with a different display label per kid via `gamification_configs.currency_name`.

**6. "Custom rewards on tasks land in the Prize Box."** Only when wired through `reward_reveals` → `reward_reveal_attachments` → reveal fires → `earned_prizes` row created. **Inline `task_rewards.reward_type='custom'`** does NOT land in PrizeBox today (recon §4.4 defect — NEW-AAA proposed).

**7. "Family Celebrations exist."** Per spec yes. Per code/schema — no. The `family_victory_celebrations` table doesn't exist in production; nothing renders it.

**8. "The connector layer is something we're starting from scratch."** Mostly true, with the important exception that `reward_reveal_attachments` already implements a junction-table polymorphic-source pattern that closely matches the switchboard vision. The architecture decision is whether to extend that table to be the central switchboard, replace it, or treat it as one of N consumer endpoints alongside a new connector table.

---

> **End of report.**
>
> File written to `c:\dev\MyAIMCentral-family\MyAIMCentral-family\claude\web-sync\REWARDS_GROUND_TRUTH_2026-04-25.md` per dispatch contract.
>
> Companion document: [REWARDS_RECON_2026-04-25.md](REWARDS_RECON_2026-04-25.md) for kid-facing surface analysis.
> Audit context: [AUDIT_REPORT_v1.md](AUDIT_REPORT_v1.md) F58, F61, F62, F8, F12, F28, F29, F30; SCOPE-3.F11; NEW-AA, NEW-QQ, NEW-WW, NEW-XX, NEW-YY.
> Triage context: [TRIAGE_WORKSHEET.md](TRIAGE_WORKSHEET.md) Rows 9, 32, 38, 39, 43, 65, 67, 68, 69, 81, 83, 92, 102, 174, 196, 202, 203, 204.
> Composition Architecture context: [Composition-Architecture-and-Assembly-Patterns.md](Composition-Architecture-and-Assembly-Patterns.md) Sections 1.1, 1.2, 1.3, 1.5 (Composition I), 1.6, 1.7.
