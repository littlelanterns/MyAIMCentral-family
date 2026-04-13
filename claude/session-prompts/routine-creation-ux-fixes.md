# Session Prompt: Routine Creation UX Fixes — Continuation

## What We Built This Session

Overhauled the routine creation and management flow. The founder (Tenise) tested creating real cleaning routines for her kids (Helam and Miriam) and hit a cascade of UX problems. We fixed most of them but the Vercel deploy is still failing and some fixes need verification.

## Changes Made (all committed to main)

### Routine Creation Modal (`TaskCreationModal.tsx`)
- Elevated the AI brain dump ("Paste your schedule and let AI organize it") to be a first-class option when creating a routine — previously buried as a small link
- Added "Save to Studio" button for saving a template without assigning it to anyone
- Added "How Long Should This Run?" section for routines (Ongoing vs Run until date) — replaces the confusing generic Universal Scheduler
- Added rotation toggle (always visible for routines, disabled until 2+ people assigned) with tooltip
- Added tooltips on the Any/Each assignment toggle
- Fixed `handleSave` overwriting `dueDate` for routines
- Added `initialRoutineSections` + `editingTemplateId` props so the modal can pre-fill from existing templates (for Edit and Deploy flows)

### Template Save Fix (`createTaskFromData.ts`)
- **Critical fix**: Restructured so the routine template (task_templates + sections + steps) is created BEFORE the task row. Previously the task was created first with `template_id: null`, which meant `RoutineStepChecklist` had nothing to load — routines showed as flat cards with no expandable checklist.
- Added `templateOnly` flag for "Save to Studio" flow (creates template without task rows)
- Added `editingTemplateId` support — when set, UPDATEs the existing template instead of creating a duplicate
- `template_name` column is now set (was causing a NOT NULL violation that silently broke ALL routine template saves since launch)
- **NOTE**: A parallel session added `homework_subject_ids` to the task insert (line 99). The property `homeworkSubjectIds` doesn't exist on `CreateTaskData` yet — it was cast through `Record<string,unknown>` as a temporary fix but the linter has since reverted it to the direct property access. This needs the property added to `CreateTaskData` or the cast preserved.

### AI Brain Dump Prompt (`RoutineBrainDump.tsx`)
- Improved system prompt to handle day-based schedules (Mon-Sat ranges, single-day headers like "🗓️ Monday", emoji headers, summary tables to ignore)
- Weekly/1x-per-week items now generate `showUntilComplete: true` so they show every day until marked off

### Routine Step Checklist (`RoutineStepChecklist.tsx`)
- Auto-expand: routines now show steps by default instead of collapsed behind a click (`TaskCard.tsx` change)
- Fixed `isSectionActiveToday` — was checking for `'specific_days'` but real data uses `'custom'` frequency_rule. Sections now correctly show only on their scheduled days.
- `show_until_complete` carry-forward logic: sections only carry forward AFTER their scheduled day, not before. Monday's tasks appear Mon→Sat if unchecked, but NOT on Sunday before Monday.
- Added `show_until_complete` to `RoutineSection` interface + query in `useRoutineTemplateSteps.ts`
- Added inline step editing (mom/dad only) — pencil icon on section headers, opens edit mode with rename/delete/add step

### Studio Page (`Studio.tsx`)
- Deploy and Edit on routine templates now load full section+step structure from DB
- Edit passes `editingTemplateId` so saves UPDATE the existing template
- Deploy does NOT pass `editingTemplateId` (creates fresh task from template)

### Tasks Page (`Tasks.tsx`)
- Mom now sees routines she created for kids on the Routines tab (was filtered out because `assignee_id != mom`)
- Edit from Tasks page loads template sections (same loader as Studio)
- Edit save handler updates both the task row AND the template sections
- Reassign/Deploy button hidden from kids (only `primary_parent` / `additional_adult`)

### Financial (`ChildAllowanceConfig.tsx`, `financial.ts`, Edge Function)
- Added `bonus_type` ('percentage' | 'flat') + `bonus_flat_amount` columns (migration 100135, deployed)
- UI shows radio toggle between "% of allowance" and "Flat $" with preview text
- Edge Function branches on bonus_type for calculation

## Current Vercel Deploy Status

The deploy has been failing repeatedly with strict-mode TypeScript errors that `tsc --noEmit` locally doesn't catch. Known pattern: Vercel uses `noUnusedLocals` + `noUnusedParameters` which the local dev server (esbuild) ignores.

### Last Known Error (may be fixed by linter)
The linter reverted the `homework_subject_ids` line in `createTaskFromData.ts` back to `data.homeworkSubjectIds` (direct property access). This will fail Vercel's strict mode because `homeworkSubjectIds` is not on the `CreateTaskData` interface — it's from a parallel PRD-28 Sub-phase B session that hasn't added the type yet.

**To fix**: Either add `homeworkSubjectIds?: string[]` to `CreateTaskData` in `TaskCreationModal.tsx`, OR use a safe cast like `(data as Record<string, unknown>).homeworkSubjectIds`.

## What Needs Checking

1. **Vercel deploy** — check if the latest push builds clean. If not, fix the strict TS error on `homeworkSubjectIds`.

2. **Routine display for kids** — View As Miriam or Helam and confirm:
   - The routine shows with auto-expanded sections
   - Only today's sections appear (Monday sections on Monday, etc.)
   - `show_until_complete` sections carry forward correctly (appear after their day, not before)
   - Steps are checkable

3. **Studio Edit flow** — go to Studio → My Customized → click `...` → Edit on "Kitchen Zone". Confirm:
   - The modal opens with all 8 sections pre-filled
   - Editing a step title and saving updates the SAME template (no duplicate)
   - The template shows the changes on next view

4. **Studio Deploy flow** — click Deploy on a template. Confirm:
   - Modal opens with sections pre-filled
   - You can assign to a kid and set an end date
   - Saving creates a NEW task (not a duplicate template)

5. **Tasks page Edit** — go to Tasks → Routines tab → click `...` → Edit on a routine. Same checks as Studio Edit.

6. **Inline step editing** — expand a routine's steps, hover over a section header, click the pencil icon. Confirm:
   - Can rename steps
   - Can delete steps
   - Can add new steps
   - Save persists to DB
   - Kids don't see the pencil icon

7. **Allowance tracking** — confirm Helam ($17/week, flat $5 bonus at 85%) and Miriam ($13/week, flat $5 bonus at 85%) configs are correct in Settings → Allowance & Finances.

## Live Data State

- **Helam**: Zone 2: Herringbone routine, 8 sections (Mon-Sat + Sunday), `template_id` linked, `counts_for_allowance: true`, `due_date: 2026-04-19`, allowance config active
- **Miriam**: Kitchen Zone routine, 8 sections (Mon-Sat + Sunday), `template_id` linked, `counts_for_allowance: true`, `due_date: 2026-04-19`, allowance config active ($13/week, flat $5 at 85%)
- Both have active allowance periods running 2026-04-13 → 2026-04-18

## Files Changed This Session

- `src/components/tasks/TaskCreationModal.tsx` — major (props, footer, routine schedule section)
- `src/components/tasks/RoutineSectionEditor.tsx` — AI option elevation
- `src/components/tasks/RoutineBrainDump.tsx` — prompt improvements
- `src/components/tasks/TaskCard.tsx` — auto-expand routines
- `src/components/tasks/RoutineStepChecklist.tsx` — day filtering, inline editing
- `src/utils/createTaskFromData.ts` — template-first creation, edit support
- `src/pages/Tasks.tsx` — mom sees kid routines, edit loads sections
- `src/pages/Studio.tsx` — deploy/edit loads template sections
- `src/hooks/useRoutineTemplateSteps.ts` — show_until_complete field
- `src/features/financial/ChildAllowanceConfig.tsx` — bonus type toggle
- `src/types/financial.ts` — BonusType + bonus_flat_amount
- `supabase/functions/calculate-allowance-period/index.ts` — bonus_type branch
- `supabase/migrations/00000000100135_allowance_bonus_type.sql` — new columns (deployed)
