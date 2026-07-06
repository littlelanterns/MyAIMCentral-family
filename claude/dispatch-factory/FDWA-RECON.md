# FDWA — Family-Device Write Audit Recon Brief (Sonnet code-recon, 2026-07-04)

> Archived near-verbatim — this brief IS the build's work list. Consumed by `FDWA.md`.

## A. The 100262 pattern

`util.is_family_shadow_of(p_family UUID)` (migration 100262:94-112): `EXISTS (SELECT 1 FROM family_members fm WHERE fm.user_id=auth.uid() AND fm.role='family' AND fm.family_id=p_family)`; SECURITY DEFINER, search_path=public, EXECUTE→authenticated only.
Two coverage patterns in the wild: (1) additive `OR util.is_family_shadow_of(family_id)` on policies — 100262:363-451 covers tasks, task_assignments, task_completions, routine_step_completions, intention_iterations, family_intention_iterations, lists, list_items; (2) SECURITY DEFINER RPC with explicit shadow branch — `util.can_arrange_member_stickers()` (100275) backing place_member_creature/set_member_last_viewed_page; `consume_opportunity_list_item` (100280) inline check. **Coverage is piecemeal — patched table-by-table as bugs surfaced; most tables never got the memo.**

## B. Coverage table ((a) covered · (b) BLOCKED · (c) unreachable)

| Table/surface | Write path | Shadow admitted? | Class | Fix |
|---|---|---|---|---|
| 8 tables from 100262 | many hooks | yes | (a) | none |
| member_creature_collection, member_sticker_book_state.last_viewed | RPCs (100275) | yes | (a) | none |
| list_items opportunity consume | RPC (100280) | yes | (a) | none |
| deed_firings (whole Connector pipeline) | fireDeed.ts:14 | yes — family-wide policy 100200:25-32; dispatch_godmothers SECURITY DEFINER (100219:10-16) bypasses downstream | (a) | none |
| task_claims | claim hooks | yes — tcl_via_task family-wide (mig 8:270-275) | (a) | none |
| earned_prizes INSERT | award RPC (100266/100278) + family-wide 100144:56-64 | yes | (a) | none |
| meeting_agenda_items INSERT | Guided capture | yes — mai_family_insert family-wide (100146:277-279) | (a) | none |
| activity_log_entries | logger | yes — WITH CHECK(true) (schema batch:433) | (a) | none |
| notifications INSERT | createNotification | yes — notif_insert_any_auth (100098:628-630) | (a) | none |
| **widget_data_points** (tracker taps) | useWidgets.ts | NO — wdp_insert own/mom (100033:254-264) | **(b)** | additive |
| **practice_log** | usePractice.ts direct | NO — manage_own (100105:158-163) | **(b)** | additive |
| **journal_entries** (Write drawer Send-To, quick notes, weekly review) | SendToGrid.tsx:41, WeeklyReviewCard.tsx:378 | NO — je_manage_own (mig 6:43-46) | **(b)** | additive |
| **guided_form_responses** (SODAS/What-If/Apology) | GuidedFormFillView.tsx | NO — own only (mig 24:174-183) | **(b)** | additive |
| **dashboard_widgets** (drag-reorder) | useWidgets.ts update | NO — dw_update own/mom (100033:177-188) | **(b)** | additive |
| **dashboard_configs** | various | NO — dc_manage_own (shell_routing:32-36) | **(b)** | additive |
| **family_members** (theme_preferences/layout_preferences — Convention #47) | useThemePersistence.ts:100-104,121-125, NO catch block | NO — ONLY fm_update_primary_parent exists (auth_family_setup:108-113). **NO self-update policy for ANY role — blocks teens on their own real logins too. Pre-existing universal gap, broader than family devices.** | **(b)+** | narrow RPC or self policy — design ruling |
| **guiding_stars, best_intentions, self_knowledge** (creation; tallies covered) | direct inserts (Convention #127 child-created BIs) | NO — manage_own (pgf:38-41,83-86,164-167) | **(b)** | additive |
| **reflection_responses** | direct | NO — rr_manage_own (reflections:90-97) | **(b)** | additive |
| **rhythm_completions** | direct | NO — manage_own (100103:130-135) | **(b)** | additive |
| **randomizer_draws** (manual draws; Surprise-Me is server-side) | direct | NO — manage_own (100105:218-223) | **(b)** | additive |
| **time_sessions** (Universal Timer) | useTimer.ts:383 | NO — ts_insert_own (batch2:90-94) | **(b)** | additive (insert+update) |
| mindsweep_holding | MindSweep capture | NO — mh_manage_own (100089:78-83) | (b)? teen-reachability | conditional |
| notepad_tabs, notepad_extracted_items | Notepad (Mom/Adult/Indep) | NO — own (journal_notepad:87-90,111-117) | (b)? conditional | conditional |
| messages, family_requests, conversation_threads/spaces | Messaging | NO — own-member policies (100098) | (b)? conditional; family_requests matters for "Ask Mom" soft-claim (#265/#197) | conditional |
| **reward_proposals** (Slice 4, committed 0fd05de) | useRewardProposals.ts | NO — proposer own-row (100278:122-131) | **(b)** | additive |
| **redeem_own_prize RPC** (kid "Use it now!") | RPC 100266:195-234 | NO — auth check :214-219 lacks the shadow branch its siblings (100275/100280) have | **(b)** — regression-class gap | RPC edit (base on CURRENT prod body per KIDS-REWARDS guard-ledger rule) |
| financial_transactions, loans, allowance_periods; mom-config gamification fields; family_best_intentions | mom/dad only | n/a | (c) | none |
| color_reveal_progress, coloring_gallery | superseded, 0 rows | — | (c) | skip |

## C. Ranked severity (silent failures TODAY on a family device)
1. Theme/layout never persists (family_members — also fails for non-mom on OWN logins; no catch block).
2. Widget drag-reorder reverts (dashboard_widgets/configs).
3. Tracker taps don't record (widget_data_points).
4. Guided Forms can't save (guided_form_responses).
5. Journal Send-To silently drops (journal_entries).
6. Child-created Best Intentions/Guiding Stars/InnerWorkings fail (creation; tallies OK).
7. Practice logging fails (practice_log).
8. Redeem-own-prize fails on family tablet only (RPC gap).
9. Timer starts don't persist (time_sessions).
10. Reflections/rhythm check-ins don't save.
11. Reward proposals fail (catch now — shipped).
12. Conditional teen surfaces: mindsweep_holding, notepad, messages, family_requests.

## D. Verify at build
No Edge-Function/service-role bypass found for any class-(b) write (final grep sweep at build). Teen family-device reachability for the conditional four → founder. family_members gap is UNIVERSAL (flag separately). redeem_own_prize omission likely a miss vs siblings (confirm with KIDS-REWARDS lineage; guard-ledger discipline applies).

## E. Migration shape
ONE migration: ~12-13 additive shadow clauses (100262 DROP-IF-EXISTS/recreate pattern) + family_members decision (RPC vs policy) + redeem_own_prize edit + conditional 3-4 tables per founder answer. No new tables/columns; helper reused as-is.
