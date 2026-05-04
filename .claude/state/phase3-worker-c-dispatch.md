# Phase 3 — Worker C Dispatch Prompt (Paste-Ready)

> Paste this entire prompt into a fresh Claude Code session.
> This worker ships sub-tasks 7-10: the first four godmother implementations.

---

## Context Briefing

You are Worker C for Phase 3 of the Connector Architecture build for MyAIM Family. You implement the first four godmothers — the action functions that respond when deeds fire and contracts match.

Worker A+B has already shipped the foundational infrastructure (commits in the repo):
- `contracts` table (migration 100199)
- `deed_firings` CHECK constraint + indexes (100200)
- Coloring reveal polymorphic extension (100201)
- Allowance fixed→dynamic collapse + feature flag (100202)
- 5 godmother config tables (100203)
- `compute_streak` RPC (100204)
- Cron infrastructure + supporting tables (100205)
- `dispatch_godmothers` RPC + `dispatch_single_grant` helper (100206)
- Shared `rollGamificationForCompletion` utility in `src/lib/gamification/`

You are building the godmother functions that `dispatch_godmothers` will invoke.

**Your scope (sub-tasks 7-10):**
7. `allowance_godmother` — wrap existing allowance infrastructure
8. `numerator_godmother` — dispatch logic (Phase 3.5 ships full math)
9. `money_godmother` — wrap `awardOpportunityEarning`, make generic
10. `points_godmother` — decompose `roll_creature_for_completion`, extract points-only grant

---

## Required Reading (In Order)

1. `claude/PRE_BUILD_PROCESS.md` — **MANDATORY.** Follow the full pre-build ritual.
2. `claude/web-sync/Connector-Build-Plan-2026-04-26.md` — §6.2 items 7-10 and §6.3 (move vs reshape vs net-new).
3. `claude/web-sync/REWARDS_GROUND_TRUTH_2026-04-25.md` — Existing reward infrastructure (especially §1-§4, §7-§8).
4. `claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md` — Allowance computation details (§0).
5. `.claude/rules/current-builds/phase-3-connector-worker-ab.md` — What Worker A+B built.
6. `claude/live_schema.md` — Current schema (includes Worker A+B migrations).
7. `src/lib/gamification/rollGamificationForCompletion.ts` — The shared utility you'll be decomposing.
8. `supabase/migrations/00000000100206*` — The dispatch RPC you're wiring into.

---

## Investigation Results (Relevant to Worker C)

### INV 1 — Scope estimates for your four godmothers
| Godmother | Existing Logic | Scope |
|-----------|---------------|-------|
| allowance | `calculate_allowance_progress` RPC + `calculate-allowance-period` Edge Function | Moderate refactor — wrap for event-driven model |
| numerator | `is_extra_credit` branch inlined in allowance RPC | Thin wrapper — extract, dispatch stub for Phase 3.5 |
| money | `awardOpportunityEarning()` in `useTaskCompletions.ts` | Thin wrapper — make generic (remove opportunity-task gate) |
| points | Step 4 of `roll_creature_for_completion` RPC | Moderate refactor — extract from atomic blob |

### INV 5 — The four hook sites you'll eventually replace (NOT in this worker — Worker F does the cutover)
| Hook | File | Line | Also Calls |
|------|------|------|------------|
| useCompleteTask | useTasks.ts | ~446 | awardOpportunityEarning, createVictoryForCompletion |
| useApproveTaskCompletion | useTasks.ts | ~1048 | awardOpportunityEarning, createVictoryForCompletion |
| useApproveCompletion | useTaskCompletions.ts | ~266 | awardOpportunityEarning, createVictoryForCompletion |
| useApproveMasterySubmission | usePractice.ts | ~549 | NONE (sequential_task path only) |

**CRITICAL: Hook 4 (mastery) flips `completion_type` from `mastery_submit` → `mastery_approved` BEFORE the RPC call. The deed firing must happen AFTER this flip. This is a precondition, not a post-action. Workers C+D build the godmothers; Worker F wires the deed firings at these sites. But your godmother implementations must be aware that mastery-approved completions are a valid input.**

### INV 3 — Allowance RPC shape (relevant for allowance_godmother)
- Input: `(p_member_id, p_period_start, p_period_end, p_grace_days)`
- Returns 20 columns including completion_percentage, calculated_amount, bonus_applied, total_earned
- Reads from: family_members, allowance_configs, tasks, task_template_sections/steps, routine_step_completions
- The RPC STAYS during Phase 3 — you're wrapping it, not replacing it. Worker F deletes it later.

---

## Sub-Task 7: allowance_godmother

**What it does:** When a deed fires and a contract routes to this godmother, it signals that the deed should count toward allowance calculation.

**Phase 3 behavior (wrapping, not replacing):**
- The existing `calculate_allowance_progress` RPC and `calculate-allowance-period` Edge Function continue to handle the actual math and period close.
- The allowance_godmother's job in Phase 3 is to **register that a deed fired** for allowance purposes. It writes to `contract_grant_log` with status `'granted'` and metadata confirming the deed is allowance-eligible.
- The existing cron at `:10` (`calculate-allowance-period`) continues to run the actual calculation at period close.
- Phase 3.5 will restructure the allowance math to read from deed firings + contracts instead of directly scanning tasks.

**What to build:**
1. A godmother function: `execute_allowance_godmother(contract_id, deed_firing, payload, stroke_of)` 
2. The function validates the deed is from a valid source (task_completion, routine_step_completion)
3. It reads the `allowance_godmother_configs` row for pool assignment info (Phase 3.5 will use this; Phase 3 can default to the single existing pool)
4. Returns `{status: 'granted', grant_reference: contract_grant_log.id, metadata: {pool_id, source_type, source_id}}`
5. The actual allowance math remains in the existing RPC — this godmother is a "registration" layer that Phase 3.5 will upgrade to a "computation" layer.

**Do NOT modify:** `calculate_allowance_progress`, `calculate-allowance-period` Edge Function, or the `:10` cron.

---

## Sub-Task 8: numerator_godmother

**What it does:** When a deed fires beyond the daily floor (e.g., Maya did 3 loads of laundry when only 2 were required), the extra completions boost her numerator — they count as "above and beyond" credit.

**Phase 3 behavior:**
- The numerator concept currently lives as the `is_extra_credit` branch inside `calculate_allowance_progress` (adding `extra_credit_weight` to the completion percentage).
- Phase 3 ships the **dispatch stub**: the godmother accepts the call, logs it, but defers actual math to Phase 3.5's restructured RPC.
- Think of it as: "I'm recording that this deed counts as a numerator boost. The allowance system will read this at period close."

**What to build:**
1. A godmother function: `execute_numerator_godmother(contract_id, deed_firing, payload, stroke_of)`
2. Validates the deed source
3. Writes to `contract_grant_log` with status `'granted'` and metadata `{boost_weight: payload.payload_amount, source_type, source_id}`
4. Returns `{status: 'granted', metadata: {boost_weight, deferred_to: 'period_close'}}`
5. Phase 3.5 will read these grant log entries to compute the boosted numerator.

**Net-new code.** No existing helper to wrap — just a clean function.

---

## Sub-Task 9: money_godmother

**What it does:** When a deed fires (e.g., opportunity task completed), award a dollar amount directly to the kid's financial balance.

**Existing logic to wrap:** `awardOpportunityEarning()` in `src/hooks/useTaskCompletions.ts` (lines ~42-106). This function:
- Reads `task_rewards` for the task to get the reward amount
- Inserts a `financial_transactions` row with type `'opportunity_earned'`
- Calculates `balance_after` from the previous balance
- Convention #223: `financial_transactions` is append-only (never UPDATE, never DELETE)

**The refactor:** Extract the `financial_transactions` write into a generic callable function that:
- Accepts `(family_id, member_id, amount, description, source_type, source_reference_id)` — no longer gated behind "must be an opportunity task"
- Computes `balance_after` from the latest transaction for that member
- Inserts the row
- Returns the transaction record

**What to build:**
1. Generic helper: `src/lib/financial/grantMoney.ts` — `grantMoney({familyId, memberId, amount, description, sourceType, sourceReferenceId})`
2. Godmother function: `execute_money_godmother(contract_id, deed_firing, payload, stroke_of)`
3. The godmother calls `grantMoney` with `payload.payload_amount` as the amount
4. Returns `{status: 'granted', grant_reference: transaction.id}`
5. Update `awardOpportunityEarning` to call `grantMoney` internally (preserves backward compat for the legacy path until Worker F cuts over)

**Do NOT break** the existing `awardOpportunityEarning` call sites — they still work via the legacy path until Worker F. You're extracting a generic core, not removing the wrapper.

---

## Sub-Task 10: points_godmother

**What it does:** Award gamification points to a family member. Just points — no creature roll, no page unlock, no coloring advance. Those are separate godmothers (Worker D / future).

**Existing logic:** Step 4 of `roll_creature_for_completion` RPC:
```
-- Step 4: Award points
UPDATE family_members 
SET gamification_points = gamification_points + v_base_points,
    current_streak = ...,
    longest_streak = ...
WHERE id = v_completer_id;
```

This is bundled with streak calculation (Step 5), creature roll (Step 7), and page unlock (Step 8) in one atomic function.

**The decomposition:** Extract the "award points" piece into an independent callable:

**What to build:**
1. Generic helper: `src/lib/gamification/grantPoints.ts` — `grantPoints({supabase, memberId, familyId, points, sourceType, sourceId})`
   - Updates `family_members.gamification_points`
   - Does NOT touch streaks (that's `compute_streak` RPC, already built)
   - Does NOT roll creatures (that's a separate godmother in Worker D or future)
   - Does NOT unlock pages (separate concern)
2. Godmother function: `execute_points_godmother(contract_id, deed_firing, payload, stroke_of)`
   - Calls `grantPoints` with `payload.payload_amount` (or reads from `points_godmother_configs` for base_points if config_id is set)
   - Returns `{status: 'granted', grant_reference: member_id, metadata: {points_awarded, new_total}}`
3. The existing `rollGamificationForCompletion` continues to work unchanged for the legacy path — it still bundles everything. Worker F will eventually replace those calls with deed firings that hit individual godmothers.

**Do NOT modify** `rollGamificationForCompletion` or `roll_creature_for_completion` RPC. You're building a parallel, independent path. Legacy stays until Worker F.

---

## Constraints

- **DO NOT modify BookShelf files.**
- **DO NOT modify the four hook sites** (useCompleteTask, useApproveTaskCompletion, useApproveCompletion, useApproveMasterySubmission) — Worker F handles deed-firing wiring.
- **DO NOT remove or modify** `rollGamificationForCompletion`, `roll_creature_for_completion` RPC, `calculate_allowance_progress` RPC, `awardOpportunityEarning`, or `calculate-allowance-period` Edge Function.
- **DO NOT break existing behavior.** All legacy paths continue to work. You're building parallel new paths, not replacing old ones.
- **One commit per sub-task** (4 commits total).
- **Run `tsc -b` after every commit.** Zero errors required.
- **Register each godmother** in the dispatch infrastructure so `dispatch_godmothers` can invoke it. Check how the dispatch RPC routes to godmother functions and follow that pattern.

---

## Godmother Registration Pattern

Worker A+B built `dispatch_godmothers` which routes by `godmother_type`. Check the dispatch RPC (migration 100206) to see how it expects godmothers to be invoked. Your godmother functions must:

1. Match the expected signature: `(contract_id UUID, deed_firing JSONB, payload JSONB, stroke_of TEXT)`
2. Return the expected shape: `{status TEXT, grant_reference UUID, error_message TEXT, metadata JSONB}`
3. Be idempotent — if called twice with the same deed_firing_id + contract_id, the second call is a no-op (the `contract_grant_log` UNIQUE constraint handles this, but your function should handle the constraint violation gracefully)

If the dispatch RPC uses SQL function calls, implement as SQL functions. If it uses Edge Function HTTP calls, implement as Edge Function endpoints. Match the existing pattern.

---

## Output Format

After each sub-task commit, report:
1. Files created/modified
2. How the godmother registers with dispatch
3. Any surprises or deviations from this spec
4. `tsc -b` result

After all 4 commits, produce a summary table.

---

## Migration Numbering

Worker A+B used migrations through 100206. 

**Your migrations start at: `00000000100207`** (if you need any — godmother implementations may be code-only if they're SQL functions defined in earlier migrations or TypeScript helpers called from the Edge Function).

If your godmothers are TypeScript functions called by the dispatch Edge Function rather than SQL RPCs, you may not need migrations at all — just new `.ts` files. Follow whatever pattern the dispatch infrastructure established.
