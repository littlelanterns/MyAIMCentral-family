# Phase 3 — Worker F Dispatch Prompt (Paste-Ready)

> Paste this entire prompt into a fresh Claude Code session.
> This worker ships sub-tasks 18-20: the switchover from legacy to connector layer.

---

## Context Briefing

You are Worker F for Phase 3 of the Connector Architecture build for MyAIM Family. You wire the existing system to the new connector layer, migrate data, and remove legacy code. This is the cutover — after your work, the connector layer is the source of truth.

**Critical context:** A fresh allowance period started today with ZERO completions by any kid. This is ideal migration timing — both old and new systems produce 0%/$0.00, so the verification check is trivial. First completions this week will test the new path with real data while stakes are low.

Workers A+B, C, D, and E have shipped:
- Full connector infrastructure (contracts table, deed_firings, 10 godmothers, dispatch RPC, cron, presentation layer)
- Contract authoring UI at `/contracts`
- Prize Board at `/prize-board`
- Feature flag: `families.allowance_dispatch_via` (currently 'legacy' for all families)
- `contract_grant_log` with presentation tracking
- Generic helpers: `grantMoney`, `grantPoints`, `createVictoryForDeed`
- Shared `rollGamificationForCompletion` utility (extracted from 3 duplicated copies)

**Your scope (sub-tasks 18-20):**
18. Migration: existing partial systems → contracts + deed-firing wiring at hook sites
19. Cleanup: drop `tasks.related_intention_id`
20. Cleanup: delete legacy code paths

---

## Required Reading (In Order)

1. `claude/PRE_BUILD_PROCESS.md` — **MANDATORY.**
2. `claude/web-sync/Connector-Build-Plan-2026-04-26.md` — §6.2 items 18-20, §6.3 (move vs reshape vs net-new).
3. `claude/web-sync/REWARDS_GROUND_TRUTH_2026-04-25.md` — §1-§2 (existing wiring you're replacing).
4. `claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md` — §0 (allowance math you're preserving).
5. `.claude/rules/current-builds/phase-3-connector-worker-ab.md` — Worker A+B summary.
6. `claude/live_schema.md` — Current schema.
7. `src/lib/gamification/rollGamificationForCompletion.ts` — The shared utility you're REPLACING with deed firings.
8. `src/hooks/useTasks.ts` — Hook sites at ~lines 446 and 1048.
9. `src/hooks/useTaskCompletions.ts` — Hook site at ~line 266.
10. `src/hooks/usePractice.ts` — Hook site at ~line 549.

---

## Investigation Results (Relevant to Worker F)

### INV 5 — The four hook sites being replaced
| Hook | File | Line | Also Calls |
|------|------|------|------------|
| useCompleteTask | useTasks.ts | ~446 | awardOpportunityEarning, createVictoryForCompletion, homeschool_time_logs |
| useApproveTaskCompletion | useTasks.ts | ~1048 | awardOpportunityEarning, createVictoryForCompletion |
| useApproveCompletion | useTaskCompletions.ts | ~266 | awardOpportunityEarning, createVictoryForCompletion |
| useApproveMasterySubmission | usePractice.ts | ~549 | NONE (sequential_task path only) |

**CRITICAL SEQUENCING — Hook 4 (mastery):** The hook flips `completion_type` from `mastery_submit` → `mastery_approved` BEFORE the current RPC call. The deed firing must happen AFTER this flip. This is a precondition. Sequence: flip completion_type → THEN insert deed_firing.

### INV 14 — Verification strategy
- Fresh allowance period started today, zero completions — verification is trivial (both systems = 0)
- Feature flag `families.allowance_dispatch_via` for instant rollback
- `allowance_dispatch_audit` table for dual-logging
- Migration-time check: compare 5 fields (completion_percentage, calculated_amount, bonus_applied, bonus_amount, total_earned) — zero tolerance
- If verification fails → flip flag back to 'legacy', debug as normal bug

---

## Sub-Task 18: Migration + Deed-Firing Wiring

This is the biggest sub-task. It has three parts that ship in ONE commit (atomic switchover):

### Part A: Write contracts from existing allowance configs

For each `allowance_configs` row where `enabled = true`:
- Create a contract: `source_type='task_completion'`, `source_id=NULL` (any task), `family_member_id=config.family_member_id`, `if_pattern='every_time'`, `godmother_type='allowance_godmother'`, `stroke_of='end_of_period'`, `inheritance_level='kid_override'`
- For tasks with `counts_for_allowance=true` AND `reward_type='money'` in `task_rewards`: create a money_godmother contract at deed_override level with the reward amount as payload

For each task with `victory_flagged=true`:
- Create a contract: `source_type='task_completion'`, `source_id=task.id`, `godmother_type='victory_godmother'`, `if_pattern='every_time'`, `stroke_of='immediate'`, `inheritance_level='deed_override'`

For each task with `counts_for_gamification=true`:
- Create a contract: `source_type='task_completion'`, `source_id=task.id`, `godmother_type='points_godmother'`, `if_pattern='every_time'`, `stroke_of='immediate'`, `payload_amount=base_points`, `inheritance_level='deed_override'`

**Contracts must be readable and populated BEFORE Part B changes the hook sites.** Both paths overlap briefly — this is intentional, not a bug.

### Part B: Replace the four hook sites with deed firings

At each of the four hook sites, replace the call to `rollGamificationForCompletion` (and `awardOpportunityEarning` and `createVictoryForCompletion`) with a single deed-firing insert:

```typescript
// BEFORE (legacy):
await rollGamificationForCompletion(supabase, completionId, completerId, familyId, queryClient);
await awardOpportunityEarning(supabase, completionId, completerId, familyId);
await createVictoryForCompletion({ task, completerId, familyId, supabase });

// AFTER (connector):
await supabase.from('deed_firings').insert({
  family_id: familyId,
  family_member_id: completerId,
  source_type: 'task_completion',
  source_id: task.id,
  metadata: { task_title: task.title, task_type: task.task_type, completion_id: completionId },
  idempotency_key: `task_completion:${completionId}`
});
// dispatch_godmothers fires via database trigger or inline RPC call
```

**Per-hook specifics:**

**Hook 1 (useCompleteTask, ~line 446):**
- Gate: `!requireApproval` (only fires when task doesn't need approval)
- Replace: `rollGamificationForCompletion` + `awardOpportunityEarning` + `createVictoryForCompletion`
- Keep: homeschool_time_logs insert (not connector-related)
- Deed source_type: `'task_completion'`

**Hook 2 (useApproveTaskCompletion, ~line 1048):**
- Gate: unconditional (fires on every approval)
- Replace: `rollGamificationForCompletion` + `awardOpportunityEarning` + `createVictoryForCompletion`
- Deed source_type: `'task_completion'`

**Hook 3 (useApproveCompletion, ~line 266):**
- Gate: unconditional
- Replace: `rollGamificationForCompletion` + `awardOpportunityEarning` + `createVictoryForCompletion`
- Deed source_type: `'task_completion'`

**Hook 4 (useApproveMasterySubmission, ~line 549):**
- Gate: `params.completionId` (sequential_task path only)
- **CRITICAL SEQUENCE:** The hook flips `completion_type` from `mastery_submit` → `mastery_approved` BEFORE this point. Your deed firing goes AFTER the flip. The deed metadata should include `completion_type: 'mastery_approved'`.
- Replace: `rollGamificationForCompletion` only (no awardOpportunityEarning or createVictoryForCompletion in this path)
- Deed source_type: `'task_completion'` (with metadata noting mastery)

**Also add deed-firing to intention iteration logging:**
- Find `useLogIntentionIteration` (or wherever `intention_iterations` rows are inserted)
- After the insert, fire: `source_type='intention_iteration'`, `source_id=intention.id`, `metadata: {intention_statement, iteration_count}`
- This enables contracts wired to Best Intentions (e.g., "50th spa-visit intention → custom reward IOU")

### Part C: Flip the feature flag + verification

1. UPDATE `families SET allowance_dispatch_via = 'connector'` for the founder's family
2. Run the verification check:
   - Call legacy `calculate_allowance_progress` for each kid with current period dates
   - Call the new connector-path equivalent (contracts exist → allowance_godmother would fire on future deed firings → check that the contracts EXIST and are correctly configured)
   - Since it's a fresh period with zero completions: both should return 0%/$0.00
   - If ANY family has a mismatch: RAISE EXCEPTION (rollback the migration)
3. Log success to `allowance_dispatch_audit`

**If verification fails:** The migration rolls back atomically. Legacy code stays active. Debug as a normal bug.

### Dispatch mechanism

After a deed_firing INSERT, how does `dispatch_godmothers` get called? Two options:
- **Option A: Database trigger** — AFTER INSERT trigger on `deed_firings` calls `dispatch_godmothers(NEW.id)`. Simple, synchronous, guaranteed execution.
- **Option B: Inline RPC call** — The frontend INSERT is immediately followed by `supabase.rpc('dispatch_godmothers', { p_deed_firing_id: deedFiring.id })`. More explicit, easier to debug.

**Recommendation: Option A (trigger).** It guarantees dispatch even if the frontend crashes mid-request. The trigger is thin (just calls the dispatch RPC). If performance becomes an issue later, it can be made async via pgmq — but for one family, synchronous is fine.

---

## Sub-Task 19: Drop `tasks.related_intention_id`

Per Phase 1 design §5 — this column has zero readers, zero writers, zero data.

Migration:
```sql
ALTER TABLE tasks DROP COLUMN IF EXISTS related_intention_id;
```

One-liner. Verify `tsc -b` passes (any TypeScript types referencing this column will need updating — check generated Supabase types).

---

## Sub-Task 20: Delete Legacy Code

**Remove these functions/code paths (they're now handled by deed firings → contract dispatch → godmothers):**

1. **`src/lib/gamification/rollGamificationForCompletion.ts`** — the shared utility extracted by Worker A+B. All 3 call sites were replaced in sub-task 18 Part B. Delete the file.

2. **`awardOpportunityEarning` function** — wherever it lives (was in `useTaskCompletions.ts`, may have been moved to `src/lib/financial/` by Worker C). The `grantMoney` helper now handles this via the `money_godmother`. Delete the function. Verify no remaining callers.

3. **`createVictoryForCompletion` function** in `src/lib/tasks/createVictoryForCompletion.ts` — replaced by `createVictoryForDeed` (Worker D). The victory_godmother now handles this. Delete the file. Verify no remaining callers.

4. **The `roll_creature_for_completion` RPC** — this is the big one. It's a database function. Do NOT delete it in this sub-task if ANY code still calls it. Check:
   - Is it still called from any frontend hook? (Should not be after Part B)
   - Is it called from any other RPC or trigger? (Check `pg_depend`)
   - If zero callers remain → drop the function in a migration
   - If callers remain → leave it and document who still calls it (this would be a surprise)

5. **`calculate_allowance_progress` RPC** — KEEP this for now. Even though allowance_godmother wraps it, the existing `calculate-allowance-period` Edge Function still calls it directly for period close calculations. It stays until Phase 3.5 restructures the allowance math. Do NOT delete.

6. **`calculate-allowance-period` Edge Function** — KEEP. Still handles period close. Stays until Phase 3.5.

**What to verify before deleting each item:**
- `tsc -b` passes with the deletion
- No runtime imports reference the deleted file
- No RPC calls reference the deleted function name
- Grep for the function name across the entire codebase

---

## Switchover Sequence (CRITICAL — follow this order exactly)

1. **Part A first:** Write all contracts. Verify they exist and are correctly configured.
2. **Part B second:** Replace hook sites with deed firings. Add trigger on deed_firings to call dispatch_godmothers.
3. **Part C third:** Flip feature flag. Run verification.
4. **Sub-task 19:** Drop related_intention_id (independent, can be same commit or next).
5. **Sub-task 20:** Delete legacy code (MUST be after Part B is committed and verified).

Parts A + B + C should be ONE atomic commit. Sub-tasks 19 and 20 can be separate commits.

**The brief overlap period:** Between Part A (contracts written) and Part B (hook sites changed), BOTH paths exist simultaneously. A task completion fires BOTH the legacy `rollGamificationForCompletion` AND (after Part B) a deed firing. This is fine — the contracts are configured but the dispatch trigger isn't active until Part B adds it. There is no double-granting window because the trigger doesn't exist yet when Part A commits.

---

## Constraints

- **DO NOT modify BookShelf files.**
- **DO NOT modify Worker E's UI files** (ContractsPage, ContractForm, ContractRevealWatcher) — they consume the contracts table you're populating.
- **DO NOT delete `calculate_allowance_progress` or `calculate-allowance-period`** — Phase 3.5 still needs them.
- **DO NOT delete `grantMoney` or `grantPoints` or `createVictoryForDeed`** — these are the NEW generic helpers that the godmothers use.
- **Verify zero remaining callers before EVERY deletion** in sub-task 20.
- **Run `tsc -b` after every commit.** Zero errors required.
- **If verification fails:** Do not force it. Rollback, report the discrepancy, and let the founder decide how to proceed.

---

## Output Format

After each commit, report:
1. What was done (migration/code changes)
2. Verification results (for sub-task 18)
3. Deletion verification (for sub-task 20 — grep results showing zero remaining callers)
4. `tsc -b` result

After all commits, produce:
- Summary table of what was migrated, wired, and deleted
- List of any legacy code that COULD NOT be deleted (and why)
- Confirmation that the feature flag is flipped

---

## Migration Numbering

**Your migrations start at: `00000000100219`**

Note: Migration 100218 exists (bugfix — routine due_date migration, already applied to production via direct SQL). Do NOT modify it.

**IMPORTANT — Migration history repair before pushing:** Phase 3 migrations 100199-100215 are NOT yet applied to production. Migration 100218 IS already applied (via direct SQL). Before running `supabase db push` for Phase 3, you must repair the migration history table so Supabase knows 100218 is already done:
```sql
INSERT INTO supabase_migrations.schema_migrations (version) 
VALUES ('00000000100218')
ON CONFLICT DO NOTHING;
```
Run this BEFORE `supabase db push`. Otherwise push will try to apply 100218 again and may fail or double-apply.

Suggested sequence:
- 100219 — Write contracts from existing configs + add deed_firings trigger + flip feature flag (sub-task 18, all parts)
- 100220 — Drop `tasks.related_intention_id` (sub-task 19)
- 100221 — Drop `roll_creature_for_completion` RPC if zero callers remain (sub-task 20, DB cleanup)

Code deletions (sub-task 20) are code-only commits — no migrations needed for removing TypeScript files.
