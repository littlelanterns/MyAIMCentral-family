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

## Resume instructions

When Daily Progress Marking detour completes:
1. Verify addendum §8 forward-compat held (no scope changes needed)
2. Surface to founder: "Workers 2+3 ready to resume?"
3. On approval, generate dispatch prompt incorporating all preserved decisions above
4. Add "Cross-Sibling Edit Authority" convention to CLAUDE.md
