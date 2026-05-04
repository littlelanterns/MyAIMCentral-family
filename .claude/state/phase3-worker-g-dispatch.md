# Phase 3 — Worker G Dispatch Prompt (Paste-Ready)

> Paste this entire prompt into a fresh Claude Code session.
> This worker writes Playwright end-to-end tests for the connector layer.

---

## Context Briefing

You are Worker G for Phase 3 of the Connector Architecture build for MyAIM Family. You write Playwright end-to-end tests that verify the full connector layer flow: contract creation → deed firing → godmother dispatch → grant delivery.

All Phase 3 infrastructure is shipped:
- 10 godmothers (allowance, numerator, money, points, prize, victory, family_victory, custom_reward, assign_task, recognition)
- Contract authoring UI at `/contracts`
- Prize Board at `/prize-board`
- Presentation layer (ContractRevealWatcher in all shells)
- Dispatch trigger on `deed_firings` table
- `fireDeed()` utility at 5 hook sites + intention iterations
- Feature flag flipped to 'connector'

**Your scope:** Write Playwright tests covering 4 verification scenarios + contract UI CRUD. Use the Testworth test family (not the founder's real family).

---

## Required Reading

1. `tests/e2e/` — Existing Playwright test patterns. Match the conventions (file naming, helper patterns, selectors).
2. `src/pages/ContractsPage.tsx` — The contract authoring UI you're testing.
3. `src/pages/PrizeBoard.tsx` — The IOU surface you're verifying grants appear on.
4. `src/lib/connector/fireDeed.ts` — The deed-firing utility.
5. `supabase/migrations/00000000100219*` — The dispatch trigger and contract seeding.

---

## Test Family Setup

Use the Testworth family (or whatever test family exists in the Playwright test helpers). If no test family helper exists, create test setup that:
- Logs in as the mom user
- Has at least 2 kid members to test per-kid vs family-default contracts
- Has tasks assigned to kids with `counts_for_allowance=true` and `counts_for_gamification=true`

Check `tests/e2e/helpers/` for existing auth/setup patterns. Match whatever exists.

---

## Test File Structure

Create: `tests/e2e/features/phase3-connector-layer.spec.ts`

If the file gets too large, split into:
- `tests/e2e/features/connector-contracts-crud.spec.ts`
- `tests/e2e/features/connector-deed-dispatch.spec.ts`
- `tests/e2e/features/connector-godmother-grants.spec.ts`

---

## Test Scenarios

### Scenario 1: Contract CRUD via UI

**Test: Mom creates a contract through the /contracts page**
1. Navigate to `/contracts`
2. Verify empty state renders ("No contracts yet...")
3. Click "Create Contract" (or equivalent CTA)
4. Fill Section 1 (Deed): select source_type = "Task Completion"
5. Fill Section 2 (IF): select "Every time"
6. Fill Section 3 (Godmother): select "Points", enter amount = 10
7. Fill Section 4 (Timing): select "Immediately"
8. Fill Section 5 (Presentation): select "Silent"
9. Submit the form
10. Verify the contract appears in the list view with correct summary
11. Verify the contract row exists in the database (via Supabase query in test)

**Test: Mom edits an existing contract**
1. Create a contract (reuse setup from above or seed directly)
2. Click Edit on the contract
3. Change the payload amount from 10 to 20
4. Save
5. Verify the updated value appears in the list
6. Verify the database row reflects the change

**Test: Mom deletes and restores a contract**
1. Create a contract
2. Click Delete
3. Verify it disappears from active list
4. Verify it appears in "Recently Deleted" section
5. Click Restore
6. Verify it reappears in active list

**Test: Mom creates a recognition-only contract with coloring advance**
1. Navigate to `/contracts`
2. Fill Deed: "Task Completion" (any task)
3. Fill IF: "Every time"
4. Fill Godmother: "Recognition only (no reward)"
5. Verify NO payload fields are shown
6. Fill Presentation: "Coloring Advance"
7. Submit
8. Verify the contract appears with recognition_godmother type and coloring_advance presentation

### Scenario 2: Task Completion → Deed Fires → Points Awarded

**Test: Kid completes a task, points_godmother fires**
1. Setup: Create a contract (via direct DB insert for speed): source_type='task_completion', if_pattern='every_time', godmother_type='points_godmother', payload_amount=15, stroke_of='immediate'
2. Setup: Assign a task to a test kid with counts_for_gamification=true
3. Log in as mom (or the kid, depending on approval settings)
4. Complete the task (or approve the completion)
5. Verify: `deed_firings` has a new row with source_type='task_completion'
6. Verify: `contract_grant_log` has a new row with godmother_type='points_godmother', status='granted'
7. Verify: `family_members.gamification_points` increased by 15 for the kid
8. Verify: No duplicate grants (complete the same task again if possible — idempotency check)

### Scenario 3: Task Completion → Deed Fires → Victory Created

**Test: Kid completes a victory-flagged task, victory_godmother fires**
1. Setup: Create a contract: source_type='task_completion', source_id=specific_task.id, if_pattern='every_time', godmother_type='victory_godmother', stroke_of='immediate'
2. Setup: Assign the specific task to a test kid
3. Complete the task
4. Verify: `deed_firings` row created
5. Verify: `contract_grant_log` row with godmother_type='victory_godmother', status='granted'
6. Verify: `victories` table has a new row with source='contract_grant'
7. Verify: The victory appears on the kid's Victory page (if testing UI) or in the API response

### Scenario 4: Task Completion → Deed Fires → Money Awarded (Opportunity)

**Test: Kid completes an opportunity task, money_godmother fires**
1. Setup: Create a contract: source_type='task_completion', source_id=opportunity_task.id, if_pattern='every_time', godmother_type='money_godmother', payload_amount=2.50, stroke_of='immediate'
2. Setup: Task with task_type='opportunity_claimable' or similar
3. Complete the task
4. Verify: `deed_firings` row created
5. Verify: `contract_grant_log` row with godmother_type='money_godmother', status='granted'
6. Verify: `financial_transactions` has a new row with amount=2.50, transaction_type matching the grant
7. Verify: Kid's balance increased by $2.50

### Scenario 5: Intention Iteration → Deed Fires → Custom Reward on Threshold

**Test: Best Intention tapped N times triggers custom_reward_godmother**
1. Setup: Create a contract: source_type='intention_iteration', source_id=specific_intention.id, if_pattern='on_threshold_cross', if_n=3, godmother_type='custom_reward_godmother', payload_text='Ice cream trip!', stroke_of='immediate'
2. Log iteration 1 → verify deed fires, contract does NOT match (below threshold)
3. Log iteration 2 → verify deed fires, contract does NOT match
4. Log iteration 3 → verify deed fires, contract MATCHES (threshold crossed)
5. Verify: `contract_grant_log` has exactly 1 granted row (on the 3rd iteration)
6. Verify: `earned_prizes` has a new row with prize_text='Ice cream trip!'
7. Verify: Prize Board shows the unredeemed IOU (if testing UI)

### Scenario 6: Every-Nth IF Pattern

**Test: Contract with every_nth=3 fires only on 3rd, 6th, 9th completions**
1. Setup: Create a contract: source_type='task_completion', if_pattern='every_nth', if_n=3, godmother_type='points_godmother', payload_amount=50, stroke_of='immediate'
2. Fire deed 1 → verify NO grant
3. Fire deed 2 → verify NO grant
4. Fire deed 3 → verify grant (50 points)
5. Fire deed 4 → verify NO grant
6. Fire deed 5 → verify NO grant
7. Fire deed 6 → verify grant (50 more points)

### Scenario 7: Inheritance Resolution

**Test: Kid-override replaces family-default contract**
1. Setup: Create family-default contract: source_type='task_completion', family_member_id=NULL, godmother_type='points_godmother', payload_amount=5
2. Setup: Create kid-override contract for kid A: same source_type, family_member_id=kid_A.id, godmother_type='points_godmother', payload_amount=20, override_mode='replace'
3. Kid A completes a task → verify 20 points (not 5) — kid override wins
4. Kid B completes a task → verify 5 points — family default applies (no override for kid B)

### Scenario 8: Presentation Mode — Toast Notification

**Test: Contract with presentation_mode='toast' creates a notification**
1. Setup: Create contract with presentation_mode='toast', godmother_type='points_godmother'
2. Complete a task
3. Verify: `contract_grant_log` row has presentation_mode='toast', revealed_at=NULL
4. Verify: A notification row exists in `notifications` with category='rewards' (if that's how Worker E implemented toast)
5. OR verify: `contract_grant_log` row is queryable by `usePendingReveals` hook (check the actual implementation)

### Scenario 9: Idempotency

**Test: Same deed_firing + contract_id cannot produce duplicate grants**
1. Setup: Create a contract
2. Insert a deed_firing manually
3. Call dispatch_godmothers (or let trigger fire)
4. Verify: 1 grant in contract_grant_log
5. Call dispatch_godmothers AGAIN with same deed_firing_id
6. Verify: Still 1 grant (UNIQUE constraint prevents duplicate)
7. No error thrown — graceful no-op

### Scenario 10: Contract Authoring UI — Inheritance Visualization

**Test: Contracts display with correct nesting and member colors**
1. Create a family-default contract
2. Create a kid-override contract for one specific kid
3. Navigate to `/contracts`
4. Verify: Family-default contract appears at top level
5. Verify: Kid-override appears indented under the kid's name/color
6. Verify: Kid's member color is visible on the override card

---

## Testing Approach

**For DB verification:** Use Supabase client in tests to query tables directly after UI actions. Pattern:
```typescript
const { data } = await supabase
  .from('contract_grant_log')
  .select('*')
  .eq('deed_firing_id', deedFiringId)
  .single();
expect(data.status).toBe('granted');
```

**For deed-firing timing:** After completing a task in the UI, add a brief wait (~500ms) for the database trigger to fire and dispatch_godmothers to complete before querying results. The trigger is synchronous but the frontend round-trip adds latency.

**For contract creation via DB (speed):** Most scenarios seed contracts directly via Supabase insert rather than clicking through the UI. The UI CRUD tests (Scenario 1) verify the form works; the dispatch tests (Scenarios 2-9) use direct seeding for speed and isolation.

---

## Constraints

- **DO NOT modify any source files.** This worker writes TESTS ONLY.
- **DO NOT modify BookShelf files.**
- **Use existing test helpers and patterns** from `tests/e2e/helpers/`.
- **Tests must be runnable independently** — each test sets up its own data and doesn't depend on prior test state.
- **Clean up test data** after each test (or use unique identifiers so tests don't collide).
- **Run `tsc -b` after writing tests** to verify type correctness.
- **Run the tests** and report results. If tests fail, diagnose the root cause and report it — do NOT fix source code (that's a bugfix session, not a test-writing session).

---

## Output Format

After writing all tests, report:
1. Test file(s) created
2. Total test count
3. Pass/fail results for each scenario
4. For any failures: exact error, which assertion failed, suspected root cause
5. `tsc -b` result

**If tests reveal bugs in the connector layer:** List them clearly with reproduction steps. The founder will decide whether to fix immediately or defer. Do NOT fix source code in this worker.
