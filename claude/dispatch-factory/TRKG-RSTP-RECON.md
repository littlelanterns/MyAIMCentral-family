# TRKG + RSTP — Combined Recon Brief (Sonnet agent, 2026-07-04)

> Archived condensed with citations. Consumed by `TRKG.md` + `RSTP.md`.

## TRKG findings

- **Single write choke point:** `useRecordWidgetData()` (useWidgets.ts:198-237) is the ONLY widget_data_points insert; 3 callers (Dashboard.tsx:453-462→584/839/855, FamilyOverview.tsx:1371/1926-1927, GuidedWidgetGrid.tsx:22-37/56). **Zero fireDeed anywhere on the widget path** — trackers are completely outside the Connector today. Only side effect: activity_log insert (victory-scan, :213-229).
- Goal fields are visual-only per tracker: PercentageTracker:18 goal_percentage; TallyTracker:46 target_number (StickerGridVariant :378-388 renders a client-side "Goal reached!" banner — ephemeral, no persistence/firing); TimerDuration:22; Countdown:45. **StreakTracker never reads goal_days at all** — KIDS-REWARDS S4's goal_days/prize_label/prize_image fields (WidgetConfiguration :636-649, :688-704) are write-only with zero readers.
- **Connector anticipated this:** contracts.source_type already includes 'widget_data_point'/'tracker_widget_event' (100199:20-31); if_pattern 'on_threshold_cross' implemented in dispatch_godmothers (100206:145-155 — but COUNT(deed)-semantics, not SUM(value); coincidentally equal today because all UI writes value=1 — D6); 'streak' if_pattern calls compute_streak (100206:186-193). Nothing ever fires the deed.
- **MODE-BLINDNESS REGRESSION (bigger than any registry row):** live `execute_page_unlock_godmother` (100225:197-327) implements ONLY 'immediate' + 'every_n_creatures' — the old monolith's tracker_goal branch (present through 100201:273-287) was DROPPED in the Connector rewrite; reads mode from contract payload, NOT member_sticker_book_state.page_earning_mode. `execute_creature_godmother` (100225:31-191) has NO mode branching (flat roll = random_per_task always). Seeds create every_time contracts only (:337-389). `useGamificationSettings` writes modes to member_sticker_book_state; **nothing downstream reads them** → 3 of 4 creature modes + 1 of 3 page modes are UI theater. STUB:334's "Schema + RPC branch exist" is STALE-FALSE for the live RPC (D1). Conventions #209/#210 overclaim.
- STUB contradiction D2: row 182 "Widget milestone → victory ✅ Wired" vs row 501 "⏳ Unwired" — no victory code found on widget_data_points; assume UNWIRED, verify at build.
- earned_prizes.source_type = free TEXT (no CHECK — 'widget' needs no migration); reward_reveal_attachments.source_type CHECK includes 'widget' (100143:133-136). useRewardProvenance.ts (:28-83) handles neither 'widget' nor 'routine_step'.
- Convention #271 grandfathered row: tracker widget event recording — any change MUST consume/extend get_member_day_obligations (tracker_event source_type).
- PRD-10 refs: Screen 4 prize field (L260), Custom Reward Goal qualifying condition/period/threshold (L277); Screen 5 Track This (L324-356, unbuilt); multiplayer (L282-297, 659-672, unbuilt); outgoing flows L789-797 (milestone→victory, completions→gamification — the PRD's own statement of the gap); PRD-owned stubs L880-903; color_reveal/gameboard picker mismatch (STUB:493).

## RSTP findings

- task_template_steps: ZERO reward columns (live schema confirmed). Builder UI home: RoutineSectionEditor.tsx (1077 lines; RoutineStep interface :19-33), mounted from TaskCreationModal:1898; persistence via serializeRoutineSectionsForRpc.ts → update_routine_template_atomic (100178); Convention #259 live propagation applies to new columns.
- **Step completions fire NOTHING:** useCompleteRoutineStep (useTaskCompletions.ts:405-455) = plain upsert + 5 invalidations — no fireDeed, no RPC, no reward/gamification/victory participation; same for uncomplete (:460-515); no DB trigger besides period_date (100157/100245); RoutineStepChecklist call sites (:1098-1189) clean.
- **D3 — R1 stub premise FALSE:** routine parent tasks (task_type='routine') NEVER get a Mark Complete control (TaskCard.tsx:215, :508-551 — checklist only) → no task_completions rows → the "routine-COMPLETION rewards wired at useTaskCompletion.ts:169" claim describes a path that never executes for real routines. **No routine-level completion event exists at all** — step-level is the only real event.
- Task-level pipeline for mirroring: award_custom_reward_for_completion CURRENT body = 100278:226-337 (supersedes 100267/100266 per header; guard-ledger discipline applies); idempotent via awarded_completion_id UNIQUE; Q7 approval timing :287-291; practice/mastery skip :251-253; called via awardCustomReward.ts wrapper from 4 hook sites. A step analog = sibling RPC keyed on routine_step_completions → task_template_steps.
- Multi-instance FIRST-N-COMPLETERS (#267): reward target = routine_step_completions.member_id (actual completer, #202 parity). No step-level approval concept exists (no approval_status column). Practice concept n/a to routine steps.
- reward_reveal_attachments CHECK lacks 'routine_step' (only needed for reveal-cadence features, not one-shot grants).

## Conflicts (named)
D1 STUB:334 stale-false (live RPC lost the branch). D2 contradictory victory rows 182 vs 501. D3 R1 stub false premise. D4 Settings modes = UI theater (broader than any registry row; #209/#210 overclaim). D5 reveal-attachments enum gaps. D6 on_threshold_cross COUNT vs SUM semantics.

## Open questions (absorbed into packs)
Mechanism (direct-RPC vs Connector); mode-blindness in scope?; step vs invented-aggregate granularity; step approval model; D2 resolution; useRewardProvenance ownership.
