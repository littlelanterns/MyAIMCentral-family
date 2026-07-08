# Pre-Dispatch Pack — RSTP: Per-Step Routine Rewards

> ⛔ **SUPERSEDED BY `PECON.md` (2026-07-07). DO NOT DISPATCH THIS PACK.**
> The founder's Point Economy ask (per-routine point modes + the Reward Shop, designed 2026-07-07)
> absorbs this pack's entire scope: the batch-7-approved rulings D-RSTP-1/2 and the per-step
> prize-reward design below carry INTACT into PECON Worker A Slice 3 (one payout RPC now handles
> step prizes AND routine points — one build, one payout point). Spec of record:
> `prds/addenda/PRD-24-Point-Economy-Addendum.md` §5.5. Dispatch prompts live in `PECON.md`.
> The recon evidence below (TRKG-RSTP-RECON.md RSTP section) remains accurate and cited.

> **Factory status:** ~~synthesized → decisions-pending (2 decisions, batch 7)~~ **SUPERSEDED → PECON**
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: RSTP. Priority: P4.
> Evidence: `claude/dispatch-factory/TRKG-RSTP-RECON.md` (RSTP section).
> Headline: the recon corrected the record — **routine steps fire ZERO reward pipeline today**
> (no deed, no RPC, no gamification, nothing), and the R1 stub's premise that "routine-COMPLETION
> rewards" were already wired is false: routine parent tasks never get a Mark-Complete control,
> so the completion-time hooks never execute for real routines. Step-level is the only real
> event that exists — which settles the granularity question the stub left open.

## Rulings

1. **Step-level rewards, on check-off — the only real event (D-RSTP-1).** No invented aggregate
   "routine day done" event; if the founder ever wants day-completion bonuses, that's a future
   contract pattern, not this build. Reward attribution = `routine_step_completions.member_id`
   (the actual instance completer — Convention #202/#267 FIRST-N-COMPLETERS parity).
2. **Immediate award, no approval gate, idempotent per day, never revoked (D-RSTP-2).** Routines
   have no step-approval machinery and this build doesn't invent one — mom controls exposure by
   choosing WHICH steps carry rewards. Idempotency: one award per (step_id, member_id,
   period_date) via UNIQUE key — recheck same day never double-awards; UNCHECK never revokes
   (Convention #219 celebration-only).
3. **Schema:** 4 additive columns on `task_template_steps` (`reward_type`, `reward_amount`,
   `reward_description`, `reward_image_url` + `reward_image_asset_key`) — live-propagating to
   all deployments per Convention #259, exactly like step_notes/instance_count. Live vocabulary
   (`privilege`/`custom` + money/stars) matches the task-level Section 7 model.
4. **Payout path: sibling SECURITY DEFINER RPC** `award_step_reward_for_completion(
   p_routine_step_completion_id)` mirroring the CURRENT `award_custom_reward_for_completion`
   body shape (migration 100278:226-337 — guard-ledger discipline), joining
   routine_step_completions → task_template_steps; money/stars via the existing grant paths;
   privilege/custom → earned_prizes `source_type='routine_step'` (free-TEXT column, no
   migration). Called never-throws from `useCompleteRoutineStep` (useTaskCompletions.ts:405-455)
   — additive per #199, a failed award never blocks the checkmark.
5. **No deed per step** (a 10-step routine must not fire 10 deeds) — step rewards use the direct
   award-RPC pattern, exactly like the task-level custom-reward RPC (which is also not
   deed-routed). Deeds remain the task/completion-level currency.
6. **Builder UI:** per-step reward config in `RoutineSectionEditor` (interface :19-33 + card UI)
   reusing the three-mode `RewardImagePicker`; serializer + `update_routine_template_atomic`
   extended (base on CURRENT RPC body). Shared-step note in the editor: "any assignee who
   completes an instance earns this."
7. **Provenance + registry:** `useRewardProvenance` gains `'routine_step'` (merge with TRKG's
   `'widget'` — second-lander merges); the R1 stub row + its false premise corrected at
   close-out; My Rewards history renders "Earned by completing [step] in [routine]."

## Slice plan (single Sonnet worker)
| Slice | Scope | Routing |
|---|---|---|
| 1 | Migration: 4 step columns + `award_step_reward_for_completion` RPC (idempotency UNIQUE) + atomic-RPC/serializer extension | Sonnet xhigh + rls-verifier |
| 2 | Builder UI (RoutineSectionEditor reward config + picker) + `useCompleteRoutineStep` never-throws hook + provenance + My Rewards rendering | Sonnet xhigh |
| 3 | E2E (`tests/e2e/features/routine-step-rewards.spec.ts`: step w/ privilege reward → check → prize in earned_prizes with routine_step provenance; same-day recheck no double-award; uncheck no revoke; shared multi-instance step awards the ACTUAL completer; money-type grants ledger row; propagation probe — master edit adds a reward, deployed routine shows it) + registry corrections + verification | Sonnet xhigh |
| Gates | Checkpoint 5 | **Fable if available, else Opus** |

## Open founder decisions (batch 7)
| # | Decision | Recommendation |
|---|---|---|
| D-RSTP-1 | Step-level rewards on check-off; no invented day-aggregate event | Yes — reward the event that exists |
| D-RSTP-2 | Immediate, idempotent-per-day, never revoked, no approval gate | Yes — celebration-only + mom controls via which steps carry rewards |

## Dependency edges
Consumes KIDS-REWARDS Slice-1 pipe (shipped) + RewardImagePicker. Shares useRewardProvenance
with TRKG. Coordinate with FDWA (routine_step_completions shadow policy — either order).

---

## DISPATCH PROMPT (paste into a FRESH session — after batch-7 decisions resolve)
```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for RSTP — per-step routine rewards. Pack:
claude/dispatch-factory/RSTP.md (7 rulings + 3-slice plan). Evidence:
claude/dispatch-factory/TRKG-RSTP-RECON.md (RSTP section). Decisions RESOLVED per
recommendations unless the founder noted otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. git log --since=2026-07-04; base the RPC on the
CURRENT award_custom_reward_for_completion body (100278 lineage or later — guard-ledger rule)
and the CURRENT update_routine_template_atomic body (100178 or later); check whether TRKG/FDWA
landed (provenance merge; shadow policy on routine_step_completions); re-verify recon refs;
next free migration number before every push.

READ FIRST: (1) CLAUDE.md Conventions #199/#202/#219/#259/#267 (the law this build lives
under); (2) the KIDS-REWARDS-PAGE build file's Slice 1 section (the pipe you extend + the
guard-ledger lesson); (3) the pack + recon. Create .claude/rules/current-builds/
RSTP-step-rewards.md (no YAML frontmatter), pre-build summary, founder approval BEFORE code.

HARD RULES: award is ADDITIVE never-throws (#199 — a failed award never blocks the checkmark);
one award per (step, member, period_date) via UNIQUE — recheck never double-awards, uncheck
NEVER revokes (#219); attribution = the instance completer's member_id, never assignee_id
(#202/#267); new step columns propagate live per #259 (the propagation E2E probe is required);
no deeds at step granularity (ruling 5); period_date is server-derived (#257 — the trigger from
migration 100157/100245 lineage already governs routine_step_completions; do not fight it);
three-mode RewardImagePicker reuse, never a bespoke picker.

PROOF: tests/e2e/features/routine-step-rewards.spec.ts per the pack list + tsc -b + lint +
kids-rewards pins (shared pipe — ask the founder before shared-fixture suites). NOTHING COMMITS
until green + founder eyes-on (eyes-on: put a popsicle reward on one step of a real kid's
routine, have them check it on their device, watch it land in My Rewards). Selective staging;
founder confirms before push. Close-out: Checkpoint 5, STUB corrections (R1 row → Wired with
the corrected event-model note), live_schema regen, archive build file.
```
