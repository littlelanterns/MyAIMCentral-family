# Shared Assignment Model — Worker Handoff Package

> **Filed:** 2026-04-25 by Worker ROUTINE-PROPAGATION (founder D6 Thread 3)
> **Status:** Awaiting Worker 2 (SHARED-ROUTINES) and Worker 3 (SHARED-LISTS) dispatch
> **Cross-refs:**
> - `Lists-Template-Deploy-Decisions-Needed.md` (D6 Thread 2 — separate concern, the template-deploy gap, NOT this assignment-model gap)
> - `PRD-09A-Routine-Propagation-Advance-Scheduling.md` (this worker's verification table)

---

## Why this document exists

Founder explicitly requires shared routines + shared lists working: deploy a routine or list as `is_shared=true` to multiple family members, render it on every assignee's dashboard, let any of them complete it (first to check it off marks it done for everyone), record who actually did each step in their **current** member color, credit the actual completer in allowance + gamification.

This is NOT in Worker ROUTINE-PROPAGATION's scope. But Worker 1 is the right place to author the dispatch package because:

- Worker 1 just shipped the shared utilities (`src/lib/templates/`, `src/components/templates/`) that Workers 2 and 3 will consume.
- Worker 1 already audited the schema + flow for `is_shared=true` rows during c1 + c2.5 verification (no regressions surfaced).
- Worker 1 has the most fresh context about what works today vs what's missing.

---

## Founder specification (verbatim from 2026-04-25 dispatch prompt)

> The founder requires shared routines + shared lists working. NOT in this worker's scope, but this worker MUST author the dispatch package for the next workers.
>
> Founder's specification:
> - Deploy `is_shared=true` routine to multiple members
> - Routine renders on every assignee's dashboard
> - ANY assignee can complete steps; first to check it off marks it done for everyone
> - Completion records who actually did each step (`member_id`)
> - Check-off renders in the COMPLETER's CURRENT `member_color` — live read from `family_members.member_color`, NOT snapshotted (color updates if mom edits the color later)
> - Mom-facing review surface shows who-did-what for awards
> - Allowance: completions count toward the actual COMPLETER's numerator for the week, not split among assignees
> - Same model needed on lists: shared lists where any participant can check items, completer's color renders live, allowance credits the actual completer

---

## Schema state today (audited 2026-04-25)

### Routine side

- `tasks.is_shared` BOOLEAN exists. Per Convention #119, when 2+ assignees are picked and Any/Each toggle is "Any", the modal sets `is_shared = true`.
- `task_assignments` supports multiple rows per task (one per assignee). Each row keys by `(task_id, family_member_id)`.
- `routine_step_completions.member_id` captures the actual completer per step instance. UNIQUE constraint per migration 100157 keys on `(task_id, step_id, instance_number, period_date)` — meaning today, only ONE completion can land per step per period regardless of who did it. Good for shared routines: first-to-complete wins, others see it as done.
- `family_members.member_color` is canonical (Convention #207). Read via `getMemberColor(member)` or `useMemberColor(memberId)` hook, never directly. Both `member_color` and `assigned_color` written simultaneously in settings UIs.
- Migration 100176 (this worker, c2.5) replaced the strict `(template_id, assignee_id)` unique index with a date-range overlap trigger. Multi-assignee shared routines work fine under the new rule — different `assignee_id` values for the same `template_id` never overlap with each other (the trigger pairs by `(template_id, assignee_id)`). **Worker 1 audit confirmed: no regression to is_shared=true rows from c1 or c2.5.**

### List side

- `lists.is_shared` per Convention #119 sketches a parallel pattern but list_shares + list_items.checked_by + list_items.checked_at are the existing actuators.
- `list_shares` table exists for sharing lists between members.
- `list_items.checked_by` UUID + `list_items.checked_at` TIMESTAMPTZ capture the completer.
- BUT: today's `useToggleListItem` hook (`src/hooks/useLists.ts:111`) writes `checked_by = checkedBy` only when items are checked. There's no mom-facing review surface, no live color rendering, no allowance credit yet.

---

## What's missing for Worker 2 (SHARED-ROUTINES)

### Build scope

1. **Dashboard render path for shared routines** — confirm shared routines (`is_shared=true`) appear on EVERY assignee's dashboard, not just the primary assignee. Today, `tasks.assignee_id` is single-valued; sibling assignees are tracked in `task_assignments`. The dashboard query needs to include both shapes.
2. **Anyone-can-complete UX in `RoutineStepChecklist`** — `useCompleteRoutineStep` already writes `routine_step_completions.member_id = currentMember.id` for the actor. The UNIQUE index already enforces first-to-complete-wins. But the UI on other assignees' dashboards needs to refresh to show the completed state.
3. **Color-of-completer rendering (live read, not snapshot)** — when a step is checked, the checkmark or strikethrough should render in the completer's CURRENT member color. Pull via `useMemberColor(completion.member_id)` in `RoutineStepChecklist` so a color edit by mom propagates immediately.
4. **Allowance credit goes to actual completer** — `roll_creature_for_completion` and `calculate_allowance_progress` need to credit `routine_step_completions.member_id` (the actor), not `tasks.assignee_id` (the primary). This may already work — Worker 2 must audit.
5. **Mom-facing review surface — who completed which steps when** — a per-routine admin view (modal or panel) showing the activity log: "Mosiah completed Wash Dishes at 8:42 AM today; Helam completed Clear Counter at 8:48 AM". Sortable by member or by step.

### Open questions Worker 2 must surface to founder before Phase 3

These are NOT Worker 1's to answer. They emerged from auditing the existing schema and reading the spec.

1. **When a shared routine step is completed, do other assignees still see it as "available to complete" or grayed out as "done by [Name]"?** The spec says "first to check it off marks it done for everyone" — so probably grayed out. Confirm.
2. **For multi-instance steps (`instance_count > 1`), can multiple assignees each contribute one? Or first-N-completers?** E.g. a "Vacuum 3 rooms" step — does each kid contribute one room, or does the first kid claim all 3 instances?
3. **Allowance: if 4 kids have shared bathroom and Mosiah does it 3 days while others do 0, does Mosiah's numerator get +3 or +3/4 (split)?** Founder spec says "actual completer's numerator" but the "split" model is also reasonable.
4. **Mom's color override on a completed step — does she change WHO is credited, or just the visual color?** When mom corrects a completion ("actually Helam did this, not Mosiah"), is it a re-attribution (write `member_id = helam_id`) or just a color label override?
5. **Does an `is_shared` master-template edit confirmation modal need different copy?** ("This will update routines for 4 family members — continue?") — Worker 1 shipped the generic modal that handles this case fine, but Worker 2 should review the copy with shared semantics in mind.

---

## What's missing for Worker 3 (SHARED-LISTS)

Parallel scope to Worker 2 on the lists side:

1. **`lists.is_shared = true` deploy flow** — pick multiple participants, render on every participant's surface.
2. **Anyone-can-complete UX in list_items** — already partially there (`checked_by` + `checked_at` exist). Live color rendering of who-checked-what.
3. **Mom-facing review surface for list completions** — same pattern as routines.
4. **Allowance credit on shared list completions** — if `lists.counts_for_allowance` exists (or is added), credit goes to `list_items.checked_by`.

Worker 3 may fold in **list-template deploy** if scope allows, OR defer to Worker 4 LISTS-TEMPLATE-DEPLOY (the deeper-deferred work in `Lists-Template-Deploy-Decisions-Needed.md`). Founder calls.

### Open questions Worker 3 must surface

1. Can a single list_item be "claimed" before being checked? Or is checking the only commitment? (Routines have linked-source claims; lists may want simpler model.)
2. Do shared lists have ordering semantics (sequential / randomizer mode)? Or is shared = checklist mode only?
3. Lists with `template_id` (once Worker 4 ships) — does shared apply at template OR per-deployment level?

---

## Pre-reqs landed by Worker 1 (this worker, 2026-04-25)

These are now available for Workers 2 and 3 to consume:

### Shared utilities

- `src/lib/templates/cloneRoutineTemplate.ts` — pure deep-clone primitive. Worker 3 may fork into `cloneListTemplate.ts` once Worker 4 dispatches.
- `src/lib/templates/detectRoutineOverlap.ts` — overlap detection + `dateRangesOverlap` predicate. Routine-specific math, but the `dateRangesOverlap` predicate is exported separately for any future cross-feature reuse.
- `src/lib/templates/getActiveTemplateDeployments.ts` — count + name affected family members. The `distinctAssigneeNames` and `formatNameList` helpers are general-purpose and reusable verbatim.

### Shared UI

- `src/components/templates/ScheduledStartBadge.tsx` — pure presentational pill. Reusable verbatim once shared lists support advance scheduling.
- `src/components/templates/MasterTemplateEditConfirmationModal.tsx` — audience-neutral. Reusable for shared-routine and shared-list master edits.
- `src/components/templates/RoutineOverlapResolutionModal.tsx` — routine-specific copy ("which days?"). Worker 2 may extend or fork for lists if shared lists ever get date ranges.
- `src/components/templates/RoutineDuplicateChooserDialog.tsx` — chooser pattern. Reusable for any "what would you like to do?" decision tree per Convention #255.
- `src/components/templates/RoutineDuplicateTemplateDialog.tsx` — name input + clone. Worker 3 forks for lists.

### Behavior contracts

- **Master-template propagation contract** (Convention #259, added by Worker 1 c8): "Master template edits propagate live to all active deployments via `template_id` join on `task_template_sections` and `task_template_steps`. Task-level fields snapshot on the deployed `tasks` row at deploy time and do NOT propagate. Past `routine_step_completions` survive structural edits because they key on `step_id`." Worker 2 must honor this for shared routines (it already does — shared rows still propagate via `template_id`).
- **Advance-start gating** (Worker 1 c1): `recurringTaskFilter` honors `recurrence_details.dtstart` for both RRULE and per-section-frequency routines, including `is_shared=true`. Worker 1 c1 vitest explicitly audits is_shared paths.
- **Overlap rule** (Worker 1 c2.5): pairs by `(template_id, assignee_id)` — independent across siblings even on `is_shared=true` deployments. Worker 2 should not need to extend the trigger.

---

## Phase 2 audit ask for Worker 1 (this worker)

> Confirm advance-start gating, overlap detection, and master-edit confirmation correctly handle `is_shared=true` routines that already exist in the database. Even if shared-completion UX isn't built yet, the propagation/scheduling work shouldn't break shared rows.

### Worker 1 result: PASS

- **c1 (advance-start gating):** vitest `tests/recurring-task-filter-advance-start.test.ts` includes a dedicated `is_shared=true routines (Worker 1 audit check for Worker 2)` describe block. Three cases — RRULE shared with future dtstart, per-section shared with future dtstart, per-section shared with past dtstart — all pass. The filter does not branch on `is_shared`; the dtstart check applies uniformly.
- **c2.5 (overlap detection):** the overlap rule pairs by `(template_id, assignee_id)`. Sibling assignees on a shared routine have different `assignee_id` values, so they never collide with each other. The trigger fires per-row on every INSERT/UPDATE, so a shared routine with 4 assignees is checked 4 times — each check pairs against existing rows for that specific assignee only. Verified by inspection of the trigger SQL + `detectRoutineOverlap` JS code.
- **c3 (master-template edit confirmation):** `getActiveTemplateDeployments` queries `tasks WHERE template_id = X` regardless of `is_shared`. A 4-assignee shared routine surfaces as 4 rows in the count → modal copy reads "4 active routines: A, B, C, and D" which matches the founder's example "This will update routines for 4 family members".

**No regressions for is_shared=true rows.** Worker 2 SHARED-ROUTINES inherits clean infrastructure.

---

## Recommended dispatch sequence

1. **Now (Worker 1 ROUTINE-PROPAGATION, this worker):** lands shared utilities + this dispatch doc + `Lists-Template-Deploy-Decisions-Needed.md`. Done 2026-04-25.
2. **Next (Worker 2 SHARED-ROUTINES):** ships shared routines per founder D6 Thread 3. Reuses Worker 1 shared utilities, builds shared-completion + completer-color-rendering on top. Surfaces the 5 open questions to founder during pre-build.
3. **Then (Worker 3 SHARED-LISTS):** ships shared lists, parallel of Worker 2 work. Surfaces the 3 list-specific open questions.
4. **Then (Worker 4 LISTS-TEMPLATE-DEPLOY):** ships the gap from `Lists-Template-Deploy-Decisions-Needed.md` after founder has lived experience to answer D-L1 through D-L6.

This sequence is a recommendation. Founder may dispatch Workers 2 and 3 in parallel since they touch separate code paths.

---

## Founder action requested

- Review the 5 SHARED-ROUTINES open questions when you dispatch Worker 2.
- Review the 3 SHARED-LISTS open questions when you dispatch Worker 3.
- No urgency — Workers 2 and 3 are independent of each other and independent of Worker 4.
