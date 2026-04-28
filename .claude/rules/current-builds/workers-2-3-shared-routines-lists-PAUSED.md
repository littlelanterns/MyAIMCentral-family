# Workers 2+3 — Shared Routines + Shared Lists (COMBINED)

## Status: PAUSED

> Paused 2026-04-27 to detour for Daily Progress Marking build (PRD-09A addendum).
> Resume after detour completes. All scoping decisions are preserved below.

## Reason for pause

Planning-side review surfaced that "I worked on this today" capability is critically missing across the app for standalone tasks and routine steps. This is higher-priority than sharing semantics, and the work overlaps surfaces. Building progress-marking first gives Workers 2+3 a cleaner foundation.

## Preserved scoping decisions (founder-approved 2026-04-27)

### SHARED-ROUTINES (5 questions answered)

1. **Other assignees see step as:** GRAYED OUT with checkmark in completer's color + "done by [Name]" text. Read-only for non-completer/non-mom kids. Original completer can uncheck (mistake correction). Mom can uncheck (override) and re-attribute.

2. **Multi-instance steps:** FIRST-N-COMPLETERS where N = instance_count. Anyone can claim any instance. Each instance row has its own member_id and credits its own completer.

3. **Allowance:** ACTUAL COMPLETER'S NUMERATOR. No splitting. Visual = source of truth.

4. **Mom's color override = re-attribution.** Changing the credited completer flows through everywhere. For "allowance already paid out": preferred = retroactive re-attribution; fallback = current period re-attributes, prior period display-only. Worker decides based on schema, flags in pre-build.

5. **PERMISSIONS — Cross-Sibling Edit Authority is Mom-Only.** Any entity affecting multiple family members is mom-edit-only. Other roles view, complete their part, message-suggest changes. Edit button doesn't render for non-mom on shared items. "Copy and Configure" available for own deployments only. Modal copy always names who's affected and what they'll see.

### SHARED-LISTS (3 questions answered)

1. **Claim semantics:** DISCOVERY PASS COMPLETED. Existing infrastructure: task_claims for opportunities, kanban_status on tasks, claim-to-task bridge for opportunity lists. Gap: no in-progress for non-opportunity list items. Decision: Workers 2+3 ship sharing for advancement_mode='complete' lists. Practice/mastery action buttons for list items are a separate scope item.

2. **Full four-mode sharing matrix** applies to lists same as routines. All four modes valid.

3. **Per-deployment sharing.** Templates are pure shapes. Deploy flow asks WHO, SHARING MODE, SCHEDULE.

### Bug fixes folded into scope

- Routine deploy button broken (Tenise-flagged directly)
- `bed6e781` — Herringbone routine duplicate iterations (Guided dashboard)
- `30102e19` + `cd02de88` — routines showing overdue past end date
- NEW-X (triage) — assignment mode formalization

### Borderline items (founder to decide on resume)

- `bc0597ad` — rhythm-created task with no due date showing overdue
- `7a27f006` — Family Overview "today's tasks" showing all historical

### Convention to add on resume

"Cross-Sibling Edit Authority is Mom-Only" — add as CLAUDE.md convention when Workers 2+3 ships.

### Mom-UI surfaces (enumerate with device breakdown on resume)

Routine deploy modal, list deploy modal, routine settings, list settings, kid-facing shared completion surfaces, mom review surface.

### Discovery pass results preserved

- Second-pass discovery: practice/mastery UI status table (see orchestration session 2026-04-27)
- List claim semantics discovery: existing task_claims, kanban_status, claim-to-task bridge documented
- Recommendation: ship sharing for advancement_mode='complete' lists; practice/mastery list buttons are separate scope

## Daily Progress Marking shipped — forward-compat (2026-04-28)

The detour shipped. Here's what Workers 2+3 inherits:

- **`tasks.track_progress`** exists (BOOLEAN NOT NULL DEFAULT false). Long Term Task type sets it to true.
- **`tasks.in_progress_member_id`** exists (UUID NULL, FK with ON DELETE SET NULL). Soft-claim holder.
- **"Worked on this today" UI** exists on TaskCard (standard), TaskCardGuided, TaskCardPlay. Rendered when `track_progress=true`.
- **`practice_log`** accepts `source_type` values: `'task'` and `'routine_step'` (in addition to Build J's `'sequential_task'` and `'randomizer_item'`).
- **Soft-claim semantics:** first practicer holds the claim. For SHARED tasks (Workers 2+3 scope), this relaxes to "any active practicer" — the sharing mode needs to allow multiple holders, not clear the first one. See addendum §9 and active build file "Workers 2+3 Inheritance Note."
- **`resolveTrackingProperties()`** at `src/lib/tasks/resolveTrackingProperties.ts` — single-source-of-truth helper for track property inheritance. Call from any new task-generation path.
- **`checkSoftClaimAuthorization()` and `checkSoftClaimCrossClaim()`** at `src/lib/tasks/softClaim.ts` — ready for Workers 2+3 to extend with multi-holder awareness.
- **Sequential collection create/restart** propagates `track_progress`. See `useSequentialCollections.ts` lines 173 and 424.
- **Opportunity claim (Path A)** already inherits `track_progress` from list item → list default and pre-sets `in_progress_member_id = claimer`.
- **CLAUDE.md conventions 260-265** added. Convention 262 (DnD wrapper prop drilling) is especially relevant — any new TaskCard prop must be threaded through SortableTaskItem + all 7 view components.

## Resume instructions

When ready to resume:
1. Verify addendum §9 forward-compat held (check soft-claim + practice_log + track_progress all present)
2. Surface to founder: "Workers 2+3 ready to resume?"
3. On approval, generate dispatch prompt incorporating all preserved decisions above
4. Add "Cross-Sibling Edit Authority" convention to CLAUDE.md
