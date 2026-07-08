# Active Build: PECON-SHOP (Worker B) — The Reward Shop

> **Status: CODE COMPLETE, ALL PROOF GREEN — holding for founder eyes-on + explicit commit/push approval.** Migration 100302 applied to production (+ 100304 execute-grant hardening closing an rls-verifier WARNING). E2E `point-economy-shop.spec.ts` 16/16 green (2 full re-runs), zero fixture residue, exact balance restoration confirmed. Convention #277 eyes-on tour 5/5 tours green — **found and fixed one real bug live**: `UniversalQueueModal.tsx`'s own badge/empty-state count aggregation (and the sibling `usePendingCounts.ts` hook feeding dashboard/page-level `QueueBadge` pills) both omitted store purchases entirely, so a genuinely pending purchase showed the modal's global "All caught up!" empty state instead of the correctly-built, correctly-RLS-scoped `StorePurchaseCard`. Fixed in both aggregators same-session (see Progress Log); re-verified 16/16 + all 5 tours green after the fix. `tsc -b` clean, lint clean on every touched file. New CLAUDE.md Convention #281 documents the architecture + the aggregation-omission lesson. Nothing committed — holding per the standing "nothing commits until the seat calls it" instruction.
> Worker A (PECON-EARN) shipped and pushed (commit `0f62108`). This build (Worker B) is the spending side: catalog, purchase lifecycle, approval flow, unlock gates, and all kid/mom surfaces.
> Pack: `claude/dispatch-factory/PECON.md` (rulings 6-9, slices B1-B4). Spec of record: `prds/addenda/PRD-24-Point-Economy-Addendum.md` §6/§7/§8.2-8.3/§9/§10.
> Decisions D-PECON-4 through D-PECON-7 RESOLVED per recommendation (pack table, founder-approved same session as Worker A's dispatch). No open founder decision for Worker B — "Reward Shop" is the confirmed display name (D-PECON-4).
> Dispatched directly by the coordination seat with explicit scope/riders (migration numbering protocol, shared-suite serialization, SM-C parallel territory, nothing commits until seat calls it).

## Freshness preamble (run before writing code)

- `point_transactions` verified LIVE in production (20 rows, matches Worker A's opening-balance backfill). `reward_shop_items`/`reward_shop_purchases` confirmed absent — my scope, clean slate.
- `git log` confirms Worker A's commit `0f62108` is the most recent; nothing else has landed since.
- Migration numbering: local files go up to `00000000100301`. Re-checked immediately before every apply (SM-C runs in parallel and may claim numbers).
- `record_point_transaction(p_family_id, p_family_member_id, p_amount, p_transaction_type, p_source_type, p_source_id DEFAULT NULL, p_description DEFAULT NULL, p_idempotency_key DEFAULT NULL, p_acted_by DEFAULT NULL) RETURNS JSONB` — REVOKEd from anon/authenticated, service_role only. My 3 purchase RPCs (SECURITY DEFINER) call it internally — same mechanism as `grant_points`.
- `member_points_today(p_member_id) RETURNS INTEGER` — client-callable, family-membership-gated (100300 rewrite). Not directly needed by Worker B but confirms the auth-gate pattern I must replicate on every new SECURITY DEFINER function that accepts a bare id: **the 100298/100300 lesson is now standing law** — every new function taking a row id must authorize (service_role OR caller shares the family) BEFORE computing/paying anything.
- `member_completion_percentage()` is **NOT built by Worker A** (confirmed in its handoff notes) — this is Worker B's to build, per addendum §6.4's fallback clause, using the same two-part blend `calculate_allowance_progress` uses (routine days via `obligation_active_for_member_on_date`, non-routine tasks direct-counted), minus money/pool coupling.
- `earned_prizes.family_member_id` is nullable ONLY when `source_type='family_goal'` (migration 100284 CHECK). Store purchases always set a real `family_member_id` — never collides with that constraint.
- `useRewardProvenance.ts` already has `'routine_step'` (Worker A). I add `'store_purchase'` resolving through `reward_shop_purchases.item_name` (the snapshot column) — no merge conflict with TRKG's `'widget'` (not landed).
- `GamificationSettingsModal.tsx` Points section already exists (Worker A A3) ending at the routine glance-list (line ~534). I insert the "[Manage the Reward Shop →]" door there. `useMyRewardsSettings.ts`'s `MyRewardsSections` interface needs a new `shop` key (default ON when gamification enabled, matching `custom_rewards`'s resolution shape).
- `PrizeBoard.tsx` has 3 tabs (allowance/prizes/balance) gated by `useViewableMembers('financial_tracking')` and the route is wrapped `<GrantedRoute grant="financial_tracking">`. Adding a 4th "Shop" tab is straightforward, BUT the addendum's ruling ("mom + reward_rules-granted adults") means a dad with ONLY `reward_rules` (not `financial_tracking`) would be blocked at the route guard before ever reaching the tab. **Decision (mine, architectural, not founder-facing):** widen `GrantedRoute`'s `grant` prop to accept an array (OR semantics) and update the `/prize-board` route to `grant={['financial_tracking', 'reward_rules']}` — small, surgical, matches the existing multi-key precedent in `useManagementGrants`.
- `RequestsTab.tsx` / `ProposalCard.tsx` is the exact precedent for `StorePurchaseCard` (own table, own card, rendered above/alongside proposals — one-inbox rule at the UI layer).
- `RewardImagePicker` (three-mode) and `BulkAddWithAI` (paste → AI parse → HITM review → save) are both drop-in reusable components — no bespoke reinvention needed.
- `createNotification` util: never chain `.select()` (documented 42501 gotcha) — followed throughout.

## Scope (rulings 6-9, slices B1-B4)

**B1 — Migration:** `reward_shop_items` (catalog, family-wide, audience pills, cost, approval flag, purchase limits, unlock_rule JSONB, RewardImagePicker fields), `reward_shop_purchases` (lifecycle: pending/approved/declined/cancelled/auto_approved, snapshots, ledger txn refs), 3 SECURITY DEFINER RPCs (`purchase_reward_shop_item`, `resolve_reward_shop_purchase`, `cancel_reward_shop_purchase`) — all family-membership-authorized per the 100298/100300 lesson, all deducting/refunding via `record_point_transaction`, `member_completion_percentage(member, start, end)` (new, built here), feature key `reward_shop` registered.

**B2 — Mom UI:** Prize Board "Shop" tab (item list CRUD, item editor w/ RewardImagePicker + BulkAddWithAI, pending strip, purchase history), Queue `StorePurchaseCard` in `RequestsTab`, notifications (auto-approve → quiet mom notice; approval-required → mom queue card + kid notice on resolve).

**B3 — Kid UI:** My Rewards "Shop" section (`my_rewards_sections.shop`) with Buy/progress/gate states, pending "Take it back," Play picture-shelf variant (image tiles, star-chip costs, always-approval, no gated items rendered).

**B4 — Proof:** `tests/e2e/features/point-economy-shop.spec.ts` (PECON-prefixed fixtures, swept, zero residue) + Convention #277 eyes-on tour + close-out docs (STUB_REGISTRY, WIRING_STATUS, CLAUDE.md convention #281, live_schema regen, help-patterns/feature-guide-knowledge).

## Hard rules (from the pack — binding)

- Deduct-at-purchase via `record_point_transaction` (spend), refund on decline/cancel (refund) — ledger is the truth; `reward_shop_purchases` rows written ONLY by the 3 RPCs (no client INSERT policy).
- `earned_prizes` rows created ONLY at auto-approve or mom-approve (never pending), `source_type='store_purchase'`, visibility `'family'`, snapshot name/image, `created_by = item.created_by`. Never revoked. Zero new redemption machinery — reuses `redeem_own_prize`/Prize Box/history.
- Purchase RPC authorizes: member's own session (`user_id` match) OR family-shadow session (`util.is_family_shadow_of`) OR parent acting-for (`acted_by`).
- Play shell: EVERY purchase requires approval regardless of item flag; gated items never render on Play.
- Unlock gates via `member_completion_percentage()`, built on the #271 blend, never inline day math. Warm progress framing, never a list of misses, never re-locks a purchased item, 0-assigned = ungated.
- Shop management RLS: mom + `reward_rules` family-wide grant; approvals mom-only v1.
- Catalog items are data. BulkAddWithAI mandatory on the item editor (#252).
- Queue card = own table precedent (`reward_proposals`/`ProposalCard` shape), never `family_requests`.
- Insufficient balance = progress framing, never an error/shame state. No hardcoded currency strings (read `gamification_configs.currency_name`).
- Every new SECURITY-DEFINER function taking a bare row id MUST include the family-membership auth gate BEFORE computing/paying anything (100298/100300 standing law).

## Mom-UI Surfaces

- Prize Board → new "Shop" tab (item CRUD, bulk-add, pending strip, history) — shells: mom + `reward_rules`-granted adults, new
- Queue RequestsTab → `StorePurchaseCard` — shells: mom, new
- GamificationSettingsModal → Points section gains "[Manage the Reward Shop →]" door — shells: mom, modification
- GamificationSettingsModal → My Rewards Page section gains "Shop" toggle row — shells: mom, modification

## Kid-UI Surfaces

- My Rewards → new "Shop" section (Buy/progress/gate states, pending) — shells: guided/independent/adult, new
- Play Rewards → picture-shelf Shop variant — shells: play, new

## Progress Log

**B1 (migration + rls-verifier):** Migration `00000000100302_reward_shop.sql` applied to production — `util.has_reward_rules_grant()`, `reward_shop_items`, `reward_shop_purchases` (SELECT-only RLS, zero write policies), `member_completion_percentage()` (built here, reusing the Convention #271 blend, since Worker A did not ship it), `purchase_reward_shop_item`/`resolve_reward_shop_purchase`/`cancel_reward_shop_purchase` (all family-membership-authorized from the FIRST draft per the 100298/100300 standing law — no gap for `rls-verifier` to find on this axis), `reward_shop` feature key. `rls-verifier` pass: PASS with one WARNING (implicit PUBLIC/anon execute grants, non-exploitable but not hardened) — closed same-session via migration `00000000100304_reward_shop_execute_hardening.sql` (explicit REVOKE/GRANT), re-verified via `has_function_privilege`.

**B2 (mom UI):** `ShopManagerTab.tsx` (Prize Board Shop tab — item CRUD via `ShopItemEditorModal.tsx` + `RewardImagePicker`, Bulk Add via the shared `BulkAddWithAI` component using a text-encoding trick, pending-approval strip, collapsible purchase history), `StorePurchaseCard.tsx` (Queue `RequestsTab` card, mirrors `ProposalCard.tsx`), `GamificationSettingsModal.tsx` Points-section door + My Rewards Page toggle row. `GrantedRoute.tsx` widened to accept an array of grant keys (OR semantics, my own architectural decision) so a `reward_rules`-only-granted adult reaches `/prize-board` without also needing `financial_tracking`.

**B3 (kid UI):** `MyRewards.tsx` gained `ShopSection`/`ShopItemCard` (Buy/progress/gate states, confirm-purchase modal, "Take it back" cancel, result banner) + the Play picture-shelf variant (image tiles, star-chip costs, no gated tiles, no dollar framing). `useMyRewardsSettings.ts` gained a `shop` toggle key. `useRewardProvenance.ts` gained a `'store_purchase'` case.

**B4 (proof):** `tests/e2e/features/point-economy-shop.spec.ts` — 16/16 passing across 2 full runs, zero PECONSHOP fixture residue, exact balance restoration verified via direct SQL (Alex 540, Casey 20, Ruthie 5). `tests/e2e/features/point-economy-shop-eyes-on-tour.spec.ts` — 5/5 tours, every screenshot read directly.

**Real bug found and fixed live by the Convention #277 tour (Tour 2, "Queue Requests tab: StorePurchaseCard for a pending purchase"):** `RequestsTab.tsx` rendered the card correctly from the first draft, but the tour's screenshot showed the Queue modal's global "All caught up!" empty state instead. Root-caused via a debug repro script capturing browser console/network activity: `UniversalQueueModal.tsx`'s own `requestsTabCount = requestsCount + proposalsCount` (feeding `totalCount`/`allEmpty`, which gates whether the tab's real content renders at all, and drives the tab's `BreathingGlow` badge) never included store purchases — confirmed via zero network calls to `reward_shop_purchases` in the initial repro (the query's `enabled: !!familyId` guard meant it never even fired, because the modal decided nothing was pending before the tab's own hook got a chance to run). The SAME omission existed a second time in the sibling `usePendingCounts.ts` hook (extracted specifically so `Dashboard.tsx`/`CalendarPage.tsx` can show `QueueBadge` pill counts without the modal being open). Fixed both: added a `storePurchasesCount`/`storePurchasesQuery` (mom-only via `isPrimaryParentForBadge`/RLS respectively, matching the existing `proposalsCount` pattern exactly) and folded it into each file's `requests`/`requestsTabCount` total. Re-ran the debug repro — `StorePurchaseCard` now renders with the exact copy ("Alex — Wants to buy from the Reward Shop", item name, cost/remaining-balance line, Approve/Not-this-time, "1 item waiting" footer). Re-ran the full tour (5/5 green) and the full E2E spec (16/16 green) to confirm no regression. Documented as CLAUDE.md Convention #281's closing paragraph — a repeatable class of bug (new decision-inbox source types must be registered in the render list AND both count aggregators, not just one).

**Close-out docs:** STUB_REGISTRY.md (Worker B's row flipped Unwired→Wired, new PECON-SHOP section with 3 genuinely-deferred stubs), WIRING_STATUS.md (new PECON-SHOP section, full capability table), CLAUDE.md Convention #281, `claude/live_schema.md` regenerated (confirms `reward_shop_items`/`reward_shop_purchases` present), `src/lib/ai/help-patterns.ts` (2 new patterns: `reward_shop`, `points_earning`), `supabase/functions/_shared/feature-guide-knowledge.ts` (`/prize-board` and `/my-rewards` PAGE_KNOWLEDGE updated, 1 new USE_CASE_RECIPE for "set up a reward shop"), `src/config/feature_guide_registry.ts` (new `reward_shop` entry) + `<FeatureGuide featureKey="reward_shop" />` wired into `ShopManagerTab.tsx` (renders nothing today — `FEATURE_GUIDES_DISABLED = true` is a pre-existing platform-wide flag, unrelated to this build, matching every other page's FeatureGuide).

## Mom-UI Verification

*(Convention #277 Claude-driven eyes-on tour — `tests/e2e/features/point-economy-shop-eyes-on-tour.spec.ts`, 5/5 tours, every screenshot read directly by Claude. PECONTOUR-prefixed fixtures, swept, zero residue, exact balance restoration confirmed post-run.)*

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Prize Board "Shop" tab — item list, "Waiting for your approval" strip, Add Reward / Bulk Add with AI | ✅ `shop-01-tab-item-list-desktop.png` — full item list, approval strip with inline Approve/Not-this-time, sidebar shows Prize Board + RewardRules registered | — | — | Mom | Screenshot read + judged | 2026-07-08 |
| `ShopItemEditorModal` — create/edit item (RewardImagePicker, cost, approval toggle, limit window, unlock gate) | ✅ `shop-02-item-editor-modal-desktop.png` | — | ✅ `shop-02-item-editor-modal-mobile.png` | Mom | Screenshots read + judged | 2026-07-08 |
| Bulk Add with AI input (text-encoding trick, shared component reuse) | ✅ `shop-03-bulk-add-input-desktop.png` | — | ✅ `shop-03-bulk-add-input-mobile.png` | Mom | Screenshots read + judged | 2026-07-08 |
| Pending-approval strip variant | ✅ `shop-04-pending-strip-desktop.png` | — | — | Mom | Screenshot read + judged | 2026-07-08 |
| Queue `RequestsTab` — `StorePurchaseCard` for a pending purchase | ✅ `shop-05-queue-store-purchase-card-desktop.png` — "Alex — Wants to buy from the Reward Shop", item name, cost/remaining-balance line, Approve/Not-this-time, "1 item waiting" footer | — | — | Mom | Screenshot read + judged. **Real bug found + fixed live** (see Progress Log) — first capture showed the modal's global "All caught up!" empty state instead; re-captured clean after the `UniversalQueueModal`/`usePendingCounts` fix | 2026-07-08 |
| `GamificationSettingsModal` — Points section "[Manage the Reward Shop →]" door | ✅ `shop-06-gamification-points-door-desktop.png` — door renders at the end of the Points section, correctly positioned before the collapsible sections list | — | — | Mom | Screenshot read + judged | 2026-07-08 |
| `GamificationSettingsModal` — My Rewards Page "Reward Shop" toggle row | ✅ `shop-07-gamification-my-rewards-toggle-desktop.png` | — | — | Mom | Screenshot read + judged | 2026-07-08 |
| My Rewards "Shop" section — Buy / gated-progress / Play states (kid-facing) | ✅ `shop-08-myrewards-shop-section-desktop.png` — pending strip with "Take it back", Buy buttons, gated item shows "440 more to go!" warm progress framing, never an error state | ✅ `shop-08-myrewards-shop-section-tablet.png` | ✅ `shop-08-myrewards-shop-section-mobile.png` | Independent (Alex) | Screenshots read + judged, all 3 viewports | 2026-07-08 |
| Confirm-purchase modal (approval-required copy) | ✅ `shop-09-confirm-purchase-modal-desktop.png` — "A grown-up will need to say yes first," informational not warning-styled | — | — | Independent (Alex) | Screenshot read + judged | 2026-07-08 |
| Play picture-shelf Shop section (zero prices, Buy/Trade tiles) | — | — | ✅ `shop-10-play-picture-shelf-mobile.png` — no dollar/numeric price framing, gated tiles show "N more to go!" only, gradient "Trade!" CTA on an affordable item | Play (Ruthie) | Screenshot read + judged | 2026-07-08 |
| Play trade-confirm flow | — | — | ✅ `shop-11-play-trade-confirm-mobile.png` | Play (Ruthie) | Screenshot read + judged | 2026-07-08 |

Mobile nav parity (Convention #16): N/A — no new top-level page was added. All surfaces live inside existing pages (Prize Board, Queue modal, GamificationSettingsModal, My Rewards) that already carry correct sidebar/BottomNav registration from prior builds.

## Post-Build Verification

*(Checkpoint 5 for this build's own scope — B1-B4 requirements: Wired / Stubbed / Missing. Zero Missing required. Whole-PECON Checkpoint 5, covering Worker A + Worker B together, is a separate section below.)*

| Requirement | Status | Evidence |
|---|---|---|
| **B1** — `reward_shop_items` catalog table + RLS | **Wired** | Migration 100302; E2E tests 11, 15 |
| **B1** — `reward_shop_purchases` lifecycle table, zero client write policies | **Wired** | Migration 100302; E2E tests 12, 14 |
| **B1** — `member_completion_percentage()` (Convention #271 blend, built here) | **Wired** | Migration 100302; E2E tests 8, 9 |
| **B1** — `purchase_reward_shop_item` RPC (auth-gated from first draft) | **Wired** | Migration 100302; E2E tests 1, 2, 5, 6, 7, 9, 10, 13 |
| **B1** — `resolve_reward_shop_purchase` RPC (mom-only approve/decline) | **Wired** | Migration 100302; E2E tests 2, 3, 14 |
| **B1** — `cancel_reward_shop_purchase` RPC (own-session/family-shadow/mom) | **Wired** | Migration 100302; E2E tests 4, 14 |
| **B1** — `reward_shop` feature key registered | **Wired** | Migration 100302 verification DO block |
| **B1** — rls-verifier pass + follow-up hardening | **Wired** | PASS + 1 WARNING closed via migration 100304; `RLS-VERIFICATION.md` |
| **B2** — Prize Board "Shop" tab (item CRUD, bulk-add, pending strip, history) | **Wired** | `ShopManagerTab.tsx`; Mom-UI rows 1-4 |
| **B2** — Queue `StorePurchaseCard` in `RequestsTab` | **Wired** | `StorePurchaseCard.tsx`; Mom-UI row 5 (incl. the real bug found+fixed) |
| **B2** — `GamificationSettingsModal` Points door + My Rewards Page toggle | **Wired** | Mom-UI rows 6-7 |
| **B2** — `GrantedRoute` widened for array grants (`financial_tracking` OR `reward_rules`) | **Wired** | `GrantedRoute.tsx`; E2E test 15 (ungranted Mark blocked) |
| **B3** — My Rewards "Shop" section (Buy/progress/gate states, "Take it back") | **Wired** | `MyRewards.tsx` `ShopSection`/`ShopItemCard`; Mom-UI rows 8-9 |
| **B3** — Play picture-shelf Shop variant | **Wired** | Mom-UI rows 10-11 |
| **B3** — `useRewardProvenance` `'store_purchase'` case | **Wired** | `useRewardProvenance.ts` |
| **B4** — E2E spec, zero residue | **Wired** | `point-economy-shop.spec.ts` 16/16, 2 full runs, zero residue both times |
| **B4** — Convention #277 eyes-on tour, every screenshot read | **Wired** | 5/5 tours, Mom-UI table above, 1 real bug found+fixed |
| **B4** — Docs close-out (STUB_REGISTRY, WIRING_STATUS, CLAUDE.md, live_schema, help-patterns/feature-guide-knowledge, feature_guide_registry) | **Wired** | See Progress Log "Close-out docs" |
| `tsc -b` clean | **Wired** | Exit 0, whole project |
| lint clean on all touched files | **Wired** | 0 errors |
| Commit + push | **Not done — holding for founder** | Per the standing "nothing commits until the seat calls it" instruction; founder eyes-on requested (stock 3 real items incl. one gated + one auto-approve, a real kid buys one on their device, mom approves, watch the prize land in My Rewards) before any commit |

**0 Missing on Worker B's own B1-B4 scope.**

## Checkpoint 5 — WHOLE PECON (Worker A + Worker B combined)

*(Per the dispatch's own close-out instruction: "Close-out: Checkpoint 5 for the WHOLE PECON build (Worker A items + yours, zero Missing), verification table copy-back to the addendum's Founder Decision Record section." Full per-slice detail lives in each worker's own build file — `.claude/rules/current-builds/PECON-earn.md` (Worker A) and this file (Worker B). This table is the combined summary; the addendum's §13 Founder Decision Record has been filled verbatim per-decision.)*

| Ruling | Owner | Status | Evidence |
|---|---|---|---|
| D-PECON-1 — Config-as-truth resolution + 3 pipeline repairs | Worker A | **Wired** | `execute_points_godmother` rewrite, `ensure_point_economy_contracts`, never-diverged NULLing (migration 100296) |
| D-PECON-2 — Per-routine points on the template, live propagation | Worker A | **Wired** | `task_templates.routine_points_mode`/`routine_step_points`/`routine_completion_points` (migration 100296) |
| D-PECON-3 — Intention points, one per-kid value, default off | Worker A | **Wired** | `gamification_configs.intention_tally_points` (migration 100296) |
| D-PECON-4 — Shop shape (family catalog, per-item audience/cost/approval, Play always-approval, reward_rules grant, "Reward Shop" name) | Worker B | **Wired** | `reward_shop_items` (migration 100302); this build |
| D-PECON-5 — Spend mechanics (append-only ledger, deduct-at-purchase w/ refund, purchases → earned_prizes) | Both | **Wired** | `point_transactions`/`record_point_transaction()` (Worker A, migration 100295); `reward_shop_purchases` + 3 RPCs (Worker B, migration 100302) |
| D-PECON-6 — Completion-% as unlock gate | Worker B | **Wired** | `member_completion_percentage()` (migration 100302) |
| D-PECON-7 — Points-only v1; dollars/treasure boxes stubbed | Worker B | **Wired (stub registered)** | STUB_REGISTRY.md PECON-SHOP section |
| D-PECON-8 — PECON supersedes RSTP, step-prize scope intact | Worker A | **Wired** | `process_routine_step_completion()` (migration 100296) |
| Riders 1-4 (points_override task field, daily points goal, shared-routine attribution pin, three-independent-rails pin) | Worker A | **Wired** | All 4 Playwright-pinned, `point-economy-earning.spec.ts` |
| Unplanned: `process_routine_step_completion` auth gap (CRITICAL) | Worker A | **Wired (fixed)** | Migration 100298 |
| Unplanned: platform-wide Phase-3 Connector lockdown (15 functions) | Worker A (seat-authorized) | **Wired (fixed)** | Migration 100300 |
| Unplanned: `reward_shop` execute-grant hardening (WARNING) | Worker B | **Wired (fixed)** | Migration 100304 |
| Unplanned: queue-badge/empty-state aggregation omitting store purchases (real bug, found live) | Worker B | **Wired (fixed)** | `UniversalQueueModal.tsx` + `usePendingCounts.ts`, this session |
| Full E2E proof | Both | **Wired** | `point-economy-earning.spec.ts` 16/16 (Worker A) + `point-economy-shop.spec.ts` 16/16 (Worker B), zero residue both |
| Convention #277 eyes-on tour, both builds | Both | **Wired** | Every screenshot in both tours read directly |
| CLAUDE.md conventions | Both | **Wired** | Convention #280 (Worker A, config-as-truth ledger) + Convention #281 (Worker B, Reward Shop) |
| `claude/live_schema.md` regeneration | Both | **Wired** | Regenerated after each migration batch; final regen confirms all PECON tables/columns present |
| STUB_REGISTRY.md / WIRING_STATUS.md / help-patterns / feature-guide-knowledge / feature_guide_registry | Both | **Wired** | Sections added by each worker at its own close-out |
| Addendum §13 Founder Decision Record filled verbatim | Worker B (final close-out) | **Wired** | `prds/addenda/PRD-24-Point-Economy-Addendum.md` §13, this session |
| Commit + push (both builds) | — | **Not done — holding for founder/seat sign-off** | Selective staging prepared; nothing staged/committed per the standing instruction |

**0 Missing across the whole PECON build (Worker A + Worker B).** Both builds are code-complete and proof-complete; the only remaining step is founder eyes-on and the coordination seat's explicit commit/push go-ahead.
