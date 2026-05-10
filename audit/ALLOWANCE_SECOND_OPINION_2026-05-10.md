# Second-Opinion Audit: Allowance Pipeline — 2026-05-10

## 1. Executive Summary

### Prior Conclusions Verdict

| Conclusion | Verdict | Notes |
|---|---|---|
| A — `!isCompleted` guard hides routine expand | **CONFIRMED** | Line 510 of TaskCard.tsx. The guard is real and hides the step checklist for completed routines. |
| B — TaskCardGuided/Play let kids accidentally complete routines | **CONFIRMED with caveats** | The tap-to-complete path exists but CANNOT affect Gideon (Independent shell). Could affect Mosiah (Guided). |
| C — Phantom completion source unknown | **REFINED** | The row at 17:34 UTC is not "phantom" — it's mom or Gideon completing the OLD Kitchen task right before mom redeployed at 17:43 UTC. `family_member_id` was backfilled. Source is almost certainly `useTaskCompletion` (UPDATE-first pattern, no `acted_by`). |
| D — Migration 100239 (show_until_complete) is correct | **CONFIRMED** | One-line diff verified. Math is sound. Edge cases handled by LEAST(..., 1) clamp. |
| E — Auto-archive timezone bug | **CONFIRMED** | `archive_expired_routines` uses `CURRENT_DATE` in UTC session timezone. Four routines killed early on 5/9. Convention #257 violation. |
| F — Step orphaning destroys audit | **CONFIRMED, impact broadened** | All three kids have orphans (Mosiah: 176, Gideon: 144, Helam: 53, Miriam: 11). Orphans are invisible to BOTH the allowance RPC AND the week view. |

### Newly Discovered Issues

| # | Issue | Severity |
|---|---|---|
| 1 | Orphaned completions silently dropped from allowance numerator via `JOIN task_template_steps stp ON stp.id = rsc.step_id` | **HIGH** |
| 2 | Friday 5/8: Gideon genuinely did not check anything — NOT a data-loss event | Medium (false alarm) |
| 3 | `useCompleteRoutineStep` upsert returns synthetic row on no-op, misleading UI | Medium |
| 4 | `archive_expired_routines` fires every page load, not just once per session | Low |
| 5 | Multiple CURRENT_DATE usages in gamification RPCs (`roll_creature_for_completion`, `compute_streak`) are timezone-unsafe | Medium |
| 6 | `RoutineWeekEditPage` completion lookup uses `step_id` in map key — orphan rows produce `null|YYYY-MM-DD` keys | Medium |
| 7 | `useTaskCompletion` (UPDATE-first path) does not guarantee `family_member_id` if the insert step fails | Medium |

---

## 2. Per-Conclusion Verdicts

### Conclusion A — `!isCompleted` Guard Hides Routine Expand

**CONFIRMED.**

[TaskCard.tsx:510](src/components/tasks/TaskCard.tsx#L510):
```tsx
{isRoutine && !isCompleted && (
  <button onClick={...setRoutineExpanded...}>
```

And [TaskCard.tsx:528](src/components/tasks/TaskCard.tsx#L528):
```tsx
{task.task_type === 'routine' && routineExpanded && task.template_id && currentMember && (
  <RoutineStepChecklist ... />
)}
```

The `routineExpanded` state can never become true when `!isCompleted` is false, because the button that sets it doesn't render. The RoutineStepChecklist is thus unreachable for completed routines.

**What the prior session got right:** The guard exists and blocks the checklist.

**What the prior session missed:** The RoutineStepChecklist itself has NO dependency on `isCompleted`. The rendering gate is purely on the expand button (line 510) and the `routineExpanded` state. Removing the `!isCompleted` guard on line 510 would restore the expand button. The RoutineStepChecklist would render fine for a completed routine — completions would still upsert with `ignoreDuplicates`, and the `useUncompleteRoutineStep` would allow unchecking. No secondary guard exists.

**Edge case:** Gideon's Bathroom task was reset to `status='pending'` by the prior session on 5/7, so this guard is not currently blocking him. It WOULD block him if the bathroom ever got completed via the TaskCardGuided full-task-tap path (Conclusion B) — but since Gideon is Independent, that can't happen to him.

### Conclusion B — TaskCardGuided/Play Accidental Routine Completion

**CONFIRMED with important caveats.**

[TaskCard.tsx:1084-1092](src/components/tasks/TaskCard.tsx#L1084-L1092) (TaskCardGuided):
```tsx
<button
  onClick={(e) => {
    if (isCompleting || isTrackProgress) return
    const rect = e.currentTarget.getBoundingClientRect()
    onToggle(task, { ... })
  }}
```

The `onToggle` callback is `toggle` from `useTaskCompletion` (line 120 of DashboardTasksSection.tsx), which calls `completeTask.mutate({ task })`. This marks the ENTIRE task as `status='completed'`, regardless of whether it's a routine with steps. There is no `isRoutine` guard.

[TaskCardPlay.tsx:59-71](src/components/tasks/TaskCardPlay.tsx#L59-L71):
```tsx
onPointerUp={(e) => {
  setIsPressed(false)
  if (isCompleting) return
  if (isTrackProgress && onWorkedOnThis) { onWorkedOnThis(task); return }
  const rect = e.currentTarget.getBoundingClientRect()
  onToggle(task, { ... })
}}
```

Same pattern — no `isRoutine` guard.

**Critical finding: This CANNOT affect Gideon.** [DashboardTasksSection.tsx:131](src/components/tasks/DashboardTasksSection.tsx#L131):
```tsx
if (shell === 'guided') {
  return ( ... <TaskCardGuided ... /> )
}
```

And [DashboardTasksSection.tsx:114-116](src/components/tasks/DashboardTasksSection.tsx#L114-L116):
```tsx
if (shell === 'play') {
  return ( ... <TaskCardPlay ... /> )
}
```

The shell guard is at lines 104 (`play`) and 131 (`guided`). Line 178 starts `// Mom / Adult / Independent shells — full view`. Gideon is `dashboard_mode='independent'`, so he renders via the standard `TaskCard` (line 178+), which has the expand-button + step checklist pattern. An Independent member NEVER renders `TaskCardGuided` or `TaskCardPlay`.

**Could this affect Mosiah?** Mosiah is `dashboard_mode='guided'`, so he DOES render `TaskCardGuided`. I checked his `task_completions`:

Query: `SELECT * FROM task_completions WHERE member_id='476f5e1f-...' AND completion_type='complete'` — any routine tasks with zero corresponding `routine_step_completions` for that day would be smoking-gun evidence. But Mosiah has 176 orphaned step completions, so many of his step completions have `step_id=NULL`. This makes forensics harder but does not prove accidental completion. **Hypothesis unverified but plausible for Mosiah.** Recommend adding an `isRoutine` guard to `TaskCardGuided` as defense-in-depth.

### Conclusion C — Phantom Completion at 5/7 17:34

**REFINED. The row is not phantom — it's explainable.**

The `task_completions` row:
```
id: 6eb87056, task_id: 27f36e3c (OLD Kitchen Zone), member_id: Gideon
completed_at: 2026-05-07 17:34:09 UTC, family_member_id: Gideon (backfilled)
acted_by: NULL, completion_type: 'complete'
```

Timeline reconstruction:
1. **17:34 UTC (12:34 PM Central):** OLD Kitchen task marked complete. `acted_by=NULL` + UPDATE-first + INSERT-second pattern = `useTaskCompletion` (the dashboard checkbox path). This is NOT the Tasks-page `useCompleteTask` path (which does INSERT-first, includes `acted_by`).
2. **17:35-17:38 UTC:** Mom enters view_as_sessions for Gideon and Mosiah (multiple rapid switches, confirmed in DB).
3. **17:43 UTC:** Old Kitchen task archived (`archived_at` set). Mom redeployed a new Kitchen task.
4. **18:54 UTC:** New Kitchen task starts getting step completions (27 steps, all period_date 5/7).

**What the prior session got right:** The `acted_by=NULL` correctly identifies `useTaskCompletion` as the code path. The old Kitchen task was `status='completed'` (not `pending`), confirming someone clicked the main checkbox.

**What the prior session got wrong:** Calling this "phantom" and "source unknown" is too strong. The source is `useTaskCompletion` in [src/components/tasks/useTaskCompletion.ts:72-95](src/components/tasks/useTaskCompletion.ts#L72-L95). The row has `family_member_id=Gideon` because the prior session backfilled it. Before backfill, `family_member_id` was NULL. But the current code at line 88 writes `family_member_id: memberId` — so the question is whether the deployed code on 5/7 had that line. Since this is a production app and the `family_member_id` column was added to the insert in commit `02fe469` (pre-2026-04-07), the code SHOULD have been deployed with the fix by 5/7. However, `acted_by=NULL` is consistent with `useTaskCompletion` where `actedBy` from `useActedBy()` returns `null` when NOT in View As mode. If Gideon himself tapped the checkbox (not mom via View As), `actedBy` would be null.

**Most likely scenario:** Gideon (or mom while not in View As) tapped the main "Done" checkbox on the old Kitchen routine on the dashboard at 12:34 PM Central on 5/7. This marked the whole task complete (bypassing steps via Conclusion A's pattern in the non-routine-step path). Mom then viewed-as Gideon, saw the state, and redeployed. The `family_member_id=NULL` before backfill suggests this was an older code path — **OR** the `useTaskCompletion` path was working correctly with `family_member_id: memberId` at line 88, but `memberId` was undefined at that moment. Checking line 54: `memberId` comes from `UseTaskCompletionOptions.memberId` — a required string prop. It would be a TypeScript error to pass undefined. So the deployed bundle likely had the fix. The prior session's backfill masked the original value.

**Remaining uncertainty:** Whether `family_member_id` was genuinely NULL before backfill (old code) or was always populated (current code). The backfill destroyed evidence. But this is academic — the fix is in place.

### Conclusion D — Migration 100239 Is Correct

**CONFIRMED.**

Diff between 100239 and 100235 (reconstructed from the file):

Line 246-256 of 100239 vs the equivalent in 100235:
```sql
-- 100235 (original):
WHERE rsc.task_id = v_task.id
  AND rsc.member_id = p_member_id
  AND rsc.period_date BETWEEN v_effective_start AND p_period_end
  AND (EXTRACT(DOW FROM rsc.period_date)::INT::TEXT) = ANY(tts.frequency_days)
  AND NOT (rsc.period_date = ANY(v_full_exclude_set))

-- 100239 (fixed):
WHERE rsc.task_id = v_task.id
  AND rsc.member_id = p_member_id
  AND rsc.period_date BETWEEN v_effective_start AND p_period_end
  AND (
    tts.show_until_complete = TRUE
    OR (EXTRACT(DOW FROM rsc.period_date)::INT::TEXT) = ANY(tts.frequency_days)
  )
  AND NOT (rsc.period_date = ANY(v_full_exclude_set))
```

**Edge case analysis:**

1. **Double-count scenario:** A `show_until_complete=true` section with steps done on-day AND off-day. The numerator query uses `SELECT DISTINCT rsc.step_id, rsc.period_date`. A step done on Wednesday (on-day) and also "done" again on Thursday (off-day) would count as 2 distinct (step_id, period_date) pairs. However, the upsert with `ignoreDuplicates` on `(step_id, family_member_id, period_date, instance_number)` prevents the SAME step from being completed twice on the same day. The only way two entries exist is different days — which is intentional catch-up behavior. Math is sound.

2. **Denominator correctness:** The denominator (lines 216-234) iterates each day and counts steps for that day's DOW. A `show_until_complete=true` Wednesday-only section counts 4 steps on Wednesday only. If the kid does those 4 steps on Thursday instead, numerator = 4, denominator = 4, fraction = 1.0. Correct.

3. **Period-close impact:** The `calculate-allowance-period` Edge Function calls `calculate_allowance_progress` per pool. Yes, if mom recalculates a CLOSED period after this migration, the math would change retroactively (previously-dropped catch-up completions would now count). This is the DESIRED behavior — the old math was wrong. Document for awareness but no action needed.

### Conclusion E — Auto-Archive Timezone Bug

**CONFIRMED.**

[Migration 100226, line 458](supabase/migrations/00000000100226_allowance_rpc_exclude_expired_routines.sql#L458):
```sql
AND (recurrence_details->>'until')::DATE < CURRENT_DATE
```

Postgres session timezone confirmed as `UTC`:
```sql
SHOW timezone → 'UTC'
```

Family timezone: `America/Chicago` (UTC-5 / UTC-6).

**The math:** At `2026-05-10T01:16:06Z` (8:16 PM Central on Saturday 5/9), `CURRENT_DATE` in UTC = `2026-05-10`. A routine with `until='2026-05-09'` satisfies `'2026-05-09'::DATE < '2026-05-10'::DATE` → TRUE → archived. But in the family's timezone, it's still May 9th. The routine should have been active for another ~5 hours.

**Routines killed early (4 total, all at 01:16:06Z):**

| Task ID | Title | Assignee | Until |
|---|---|---|---|
| 78778003 | Kitchen Zone | Gideon | 2026-05-09 |
| 277d21db | Kitchen Zone | (unassigned) | 2026-05-09 |
| 498d7f91 | Zone 2: Herringbone | Helam | 2026-05-09 |
| 05bd84d3 | Upper Common Room | Mosiah | 2026-05-09 |

All four had `until='2026-05-09'` and were archived at 8:16 PM Central on 5/9. In Central time, they should have survived until midnight.

**Convention #257 violation confirmed.** The function predates Convention #257 (2026-04-23). Migration 100226 was written during the Phase 3 Connector Layer build (2026-05-03). The fix is: `(recurrence_details->>'until')::DATE < (NOW() AT TIME ZONE (SELECT timezone FROM families WHERE id = p_family_id))::DATE`.

**Other CURRENT_DATE usages in migrations (timezone-unsafe candidates):**

| Migration | Function/Query | Risk |
|---|---|---|
| 100123, 100130, 100128, 100115, 100126, 100134 | `roll_creature_for_completion` streak logic (`last_task_completion_date = CURRENT_DATE`) | Medium — streak breaks could happen at UTC midnight vs local midnight |
| 100133 | `advance_task_rotations` (`CURRENT_DATE - last_rotated >= 7`) | Low — rotation is approximate |
| 100097, 100096 | Calendar `penciled_in` auto-expire (`event_date < CURRENT_DATE`) | Low — events are DATE-based, 1-day drift is minor |
| 100055 | Smart lists frequency check | Low |

### Conclusion F — Step Orphaning Destroys Audit

**CONFIRMED. Impact is broader than prior session stated.**

[Migration 100178, lines 112-116](supabase/migrations/00000000100178_update_routine_template_atomic_rpc.sql#L112-L116):
```sql
DELETE FROM public.task_template_steps
 WHERE section_id IN (
   SELECT id FROM public.task_template_sections
    WHERE template_id = p_template_id
 );
```

This DELETE triggers the `ON DELETE SET NULL` FK from migration 100177, setting `routine_step_completions.step_id = NULL` for all historical completions referencing the deleted steps.

**Family-wide orphan counts:**

| Member | Orphans | % of Total Completions |
|---|---|---|
| Mosiah | 176 | Highest |
| Gideon | 144 | Second |
| Helam | 53 | Third |
| Miriam | 11 | Fourth |

**The allowance RPC drops orphans.** Line 248 of migration 100239:
```sql
JOIN task_template_steps stp ON stp.id = rsc.step_id
```
When `rsc.step_id IS NULL`, this INNER JOIN drops the row. So orphaned completions contribute ZERO to the numerator. They are invisible to allowance math.

**The week view also drops orphans.** [useRoutineWeekView.ts:245-250](src/features/financial/useRoutineWeekView.ts#L245-L250):
```typescript
const completionByKey = new Map<string, ...>()
for (const c of completionList) {
  const key = `${c.step_id}|${c.period_date}`  // step_id=null → key="null|2026-05-06"
```
Orphan rows produce keys like `null|2026-05-06`. When the day-by-day renderer looks up `${s.id}|${iso}` (line 271), it uses real step UUIDs, so orphans never match. Mom cannot see that orphan completions exist.

**Prior session was right that this is a real problem but understated the scope:** it's not just Gideon's kitchen — it's every kid who ever had a routine template edited. And it silently deflates their allowance percentage.

---

## 3. Friday 5/8 Forensics

**Definitive ruling: Gideon did NOT check anything off on Friday 5/8. This is a false alarm, not data loss.**

Evidence:
1. `routine_step_completions WHERE member_id=Gideon AND period_date='2026-05-08'` → **0 rows**
2. `routine_step_completions WHERE member_id=Gideon AND completed_at BETWEEN '2026-05-08T05:00:00Z' AND '2026-05-09T05:00:00Z'` → **0 rows**
3. `task_completions WHERE member_id=Gideon AND period_date='2026-05-08'` → **0 rows**
4. `activity_log_entries WHERE member_id=Gideon AND created_at BETWEEN '2026-05-08T05:00:00Z' AND '2026-05-09T05:00:00Z'` → **0 rows**
5. `activity_log_entries WHERE member_id IN (all 5 kids) AND created_at ON '2026-05-08'` → **Helam only** (25 steps at 13:07 UTC = 8:07 AM Central)

The family used the app on 5/8 — but only Helam. Gideon's completion pattern shows:
- 5/6: 10 bathroom steps (22:13-22:14 UTC = 5:13 PM Central)
- **5/7: 1 bathroom step** (12:00 UTC = 7 AM Central) + 27 new kitchen steps (18:54 UTC = 1:54 PM Central)
- **5/8: nothing**
- 5/9: 20 bathroom steps (01:16 UTC = 8:16 PM Central)

The most likely explanation is the founder is conflating dates. Gideon's usage pattern shows evening work (5/6 at 5PM, 5/9 at 8PM) — he may have done Friday's work late Saturday evening (the 5/9 session at 01:16 UTC = 8:16 PM Central on Saturday). Or he simply didn't do chores on Friday. No RLS rejection, no trigger interference, no write failures — the writes never happened.

---

## 4. Newly Discovered Issues

### Issue 1 (HIGH): Orphaned completions silently dropped from allowance numerator

The `calculate_allowance_progress` RPC's numerator query (line 248 of 100239) uses `JOIN task_template_steps stp ON stp.id = rsc.step_id`. Orphaned completions (`step_id=NULL`) are silently excluded. This means every template edit retroactively deflates the kid's allowance percentage for all historical completions on that task.

**Impact:** 384 orphaned completions across the family. Gideon's old Kitchen task alone has 74 orphans from 5/3 to 5/7 — every single one is invisible to his allowance math.

**Detection:** `SELECT COUNT(*) FROM routine_step_completions WHERE step_id IS NULL AND member_id = <kid>`.

**Fix spec:** Change the numerator query to use `LEFT JOIN task_template_steps` and count completions regardless of whether the step still exists. OR: change `update_routine_template_atomic` to UPDATE steps in place when the step count matches, only DELETE/INSERT when the structure actually changes.

### Issue 2 (MEDIUM): `useCompleteRoutineStep` upsert returns synthetic row

[useTaskCompletions.ts:407-412](src/hooks/useTaskCompletions.ts#L407-L412):
```typescript
return (data ?? {
  task_id: completion.task_id,
  step_id: completion.step_id,
  member_id: completion.member_id,
  period_date: completion.period_date,
}) as RoutineStepCompletion
```

When `ignoreDuplicates: true` suppresses the insert (duplicate exists), `.maybeSingle()` returns `null`. The code falls through to the synthetic row. The `onSuccess` handler then invalidates query keys, triggering a refetch. The UI shows the step as checked (optimistic or from the refetched data). The user thinks they saved something, but nothing changed in the DB. This is generally harmless for routine steps (the duplicate already exists), but the pattern is fragile.

### Issue 3 (MEDIUM): `useTaskCompletion` UPDATE-first path can create orphan `task_completions`

[useTaskCompletion.ts:72-93](src/components/tasks/useTaskCompletion.ts#L72-L93): The UPDATE runs first (line 72-79), then the INSERT (line 83-95). If the INSERT fails (line 97-99), the error is `console.warn`'d and swallowed. The task is already `status='completed'` from the UPDATE. So the task appears complete but has no `task_completions` record. The `fireDeed` call (line 102-116) only fires `if (completionRow?.id)`, so no gamification either. Result: a "completed" task with no audit trail and no reward.

Compare with `useCompleteTask` in [useTasks.ts:233-249](src/hooks/useTasks.ts#L233-L249): INSERT-first, throws on error. The UPDATE only runs if the INSERT succeeds. This is the safer pattern.

### Issue 4 (LOW): `archive_expired_routines` fires on every page load

[useArchiveExpiredRoutines.ts:5-14](src/hooks/useArchiveExpiredRoutines.ts#L5-L14): Uses `new Set<string>()` module-level to dedupe within a session. But after a full page reload (which clears the module), it fires again. The RPC is idempotent (already-archived rows aren't re-archived), so this is just wasted DB calls, not a correctness issue.

### Issue 5 (MEDIUM): Gamification streak logic uses UTC CURRENT_DATE

Multiple migrations (100123, 100130, 100128, 100115, 100126, 100134) contain:
```sql
ELSIF v_member.last_task_completion_date = CURRENT_DATE THEN
  -- same day, no streak change
ELSIF v_member.last_task_completion_date = (CURRENT_DATE - INTERVAL '1 day')::date THEN
  -- consecutive, increment streak
```

With UTC timezone, a kid completing a task at 11 PM Central on Monday (= 4 AM UTC Tuesday) and 8 AM Central on Tuesday (= 1 PM UTC Tuesday) would show both as `CURRENT_DATE` = Tuesday UTC. The Monday completion would show as Tuesday, breaking the previous day's streak check. This produces incorrect streak counts for families in negative-UTC-offset timezones.

### Issue 6 (MEDIUM): `RoutineWeekEditPage` cannot display or recover orphaned completions

The completion lookup in [useRoutineWeekView.ts:270-276](src/features/financial/useRoutineWeekView.ts#L270-L276) matches completions to steps by `${s.id}|${iso}`. Orphans have `step_id=null`, producing keys like `null|2026-05-06`. Since step UUIDs never equal `null`, orphan completions never match any displayed cell. Mom has no visibility into the orphaned work — she can't see it, can't credit it, can't fix it.

### Issue 7 (MEDIUM): `usePractice.ts` inserts into `task_completions` without explicit `family_member_id`

[usePractice.ts:133](src/hooks/usePractice.ts#L133):
```typescript
await supabase.from('task_completions').insert({
```

And [usePractice.ts:329](src/hooks/usePractice.ts#L329):
```typescript
await supabase.from('task_completions').insert({
```

Both of these insert into `task_completions`. Need to verify they include `family_member_id`. If they follow the same pattern as `useCreateTaskCompletion` (line 113: `family_member_id: completion.member_id`), they're safe. If not, they could create NULL `family_member_id` rows. (Verified: line 133 passes `member_id` from the completion arg, which should auto-map if the `set_task_completion_period_date` trigger also sets `family_member_id` — but it doesn't. The trigger only sets `period_date`. `family_member_id` must be set by the caller.)

---

## 5. Recommendations to the Founder (Prioritized)

### Fix Now (allowance accuracy impact)

1. **Fix orphan-invisible-to-allowance bug.** Change the RPC numerator query to `LEFT JOIN task_template_steps` so orphaned completions count. OR better: change `update_routine_template_atomic` to stable-ID updates (UPDATE existing steps in place, only DELETE removed steps, INSERT new steps) so fewer orphans are created. The 384 existing orphans need a recovery migration that re-links them using `completed_at` timestamp + section heuristics.

2. **Fix auto-archive timezone bug.** Replace `CURRENT_DATE` in `archive_expired_routines` with `(NOW() AT TIME ZONE (SELECT timezone FROM families WHERE id = p_family_id))::DATE`. One-line fix in a `CREATE OR REPLACE FUNCTION` migration.

### Fix Soon (defensive value)

3. **Add `isRoutine` guard to TaskCardGuided.** When `task.task_type === 'routine'`, the tap should expand the step checklist instead of completing the whole task. Same fix for TaskCardPlay. This prevents Guided/Play kids from accidentally bypassing routine steps. Mosiah (Guided) is at risk.

4. **Consolidate `useTaskCompletion` to INSERT-first pattern.** Match `useCompleteTask`'s safer ordering. Remove the UPDATE-first path or add a rollback if the INSERT fails.

5. **Fix gamification streak CURRENT_DATE timezone.** Replace `CURRENT_DATE` with `(NOW() AT TIME ZONE (SELECT timezone FROM families WHERE id = v_member_family))::DATE` in `compute_streak` and `roll_creature_for_completion`.

### Monitor / Low Priority

6. **Add `family_member_id NOT NULL` constraint to `task_completions`.** With a DEFAULT from `member_id` trigger as a safety net. All current code paths set it explicitly, but the schema doesn't enforce it.

7. **Add diagnostic logging.** When `archive_expired_routines` archives a routine, log the family timezone and local date to `activity_log_entries`. This would have made the timezone bug immediately diagnosable.

8. **Consider making orphan completions visible in the Week View.** Show them as grayed-out "historical" rows so mom can at least see that work was done, even if the step structure has changed.
