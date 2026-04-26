# Feature Decision File: PRD-09A — Routine Save Fix

> **Created:** 2026-04-26
> **PRD:** `prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md`
> **Convention reference:** CLAUDE.md Convention #259 — "Past `routine_step_completions` survive structural edits because they key on `step_id` (FK to `task_template_steps`). When a step is deleted, the completion rows orphan but stay readable in audit views."
> **Worker:** ROUTINE-SAVE-FIX
> **Branch:** `worker/routine-save-fix`

---

## What Is Being Built

Three-commit fix for a production save bug that left the founder unable to edit her family's routine templates whenever any historical completion existed for that template.

Worker ROUTINE-SAVE-DIAGNOSTIC (read-only, this morning) traced the bug end-to-end:

1. Mom edits routine via Tasks page → action menu → Edit.
2. `MasterTemplateEditConfirmationModal` (Worker 1's c3 work) prompts and accepts.
3. `createTaskFromData` updates `task_templates.title` successfully.
4. The next step — `DELETE FROM task_template_steps WHERE section_id = X` — fails because `routine_step_completions.step_id` FK is `ON DELETE NO ACTION` and 163+ completion rows reference these steps.
5. The throw bubbles up to `TaskCreationModal.handleEditConfirm`, whose try/finally has no catch.
6. Unhandled rejection — no toast, no error UI, modal state inconsistent.
7. Mom sees nothing happen and assumes the save worked.

This worker fixes all three layers (schema, error surfacing, atomic rewrite path) and consolidates two divergent rewrite call sites into one RPC.

---

## Commits

| Commit | Title |
|---|---|
| `e7e8221` | fix(routines): step deletion no longer blocks routine edits (c1) |
| `8ccbeef` | fix(tasks): surface save failures via error toast (c2) |
| `b100c90` | refactor(routines): consolidate template rewrite into atomic RPC (c3) |

---

## Database Changes

### Migration 100177 — `routine_step_completions_fk_set_null.sql`

- DROP CONSTRAINT `routine_step_completions_step_id_fkey` (was ON DELETE NO ACTION).
- ADD CONSTRAINT same name with `ON DELETE SET NULL`.
- Comment references Convention #259 + audit-trail rationale.
- Defensive: explicitly does NOT use CASCADE (would destroy audit trail).

### Migration 100178 — `update_routine_template_atomic_rpc.sql`

- Defines `public.update_routine_template_atomic(p_template_id uuid, p_title text, p_description text, p_sections jsonb)` as `SECURITY DEFINER LANGUAGE plpgsql`.
- `SET search_path = public, pg_temp` (defense-in-depth for SECURITY DEFINER).
- RLS check inside: caller's `family_members.family_id` must equal the template's `family_id`. Service-role calls (auth.uid() IS NULL) bypass for tooling.
- Body: UPDATE template metadata → DELETE child steps (now safe under c1) → DELETE child sections → INSERT new sections + steps from `p_sections` JSONB.
- Returns `{section_count, step_count}` jsonb.
- `GRANT EXECUTE TO authenticated`.

---

## Files Changed

### c1
- `supabase/migrations/00000000100177_routine_step_completions_fk_set_null.sql` (new)
- `src/types/tasks.ts` — `RoutineStepCompletion.step_id` widened to `string | null`
- `src/components/tasks/TaskCard.tsx` — Set construction filters NULL step_ids
- `src/components/tasks/RoutineStepChecklist.tsx` — same filter pattern
- `src/components/guided/GuidedActiveTasksSection.tsx` — same filter pattern
- `tests/routine-step-completions-set-null.test.ts` (new — 10 tests)
- `tests/verification/routine-step-completions-set-null.ts` (new — DB-behavior verification script)

### c2
- `src/components/shared/UndoToast.tsx` — `variant: 'success' | 'error'` prop, error variant uses error tokens + AlertTriangle icon + role='alert' + 10s dwell default
- `src/components/shared/RoutingToastProvider.tsx` — variant threading
- `src/components/tasks/TaskCreationModal.tsx` — `showErrorToast` helper + catch blocks in `handleSave`, `handleSaveToStudio`, `handleEditConfirm`
- `tests/task-creation-modal-save-error.test.tsx` (new — 8 tests)

### c3
- `supabase/migrations/00000000100178_update_routine_template_atomic_rpc.sql` (new)
- `src/lib/templates/serializeRoutineSectionsForRpc.ts` (new — pure helper, frequency normalization)
- `src/utils/createTaskFromData.ts` — editingTemplateId branch replaced with single RPC call + `editingHandled` guard against shared INSERT loop
- `src/pages/Tasks.tsx` — `handleEditTask` rewrites via the same RPC; throws on UPDATE error so c2 catch surfaces it
- `tests/update-routine-template-atomic.test.ts` (new — 24 tests)
- `tests/verification/update-routine-template-atomic.ts` (new — DB-behavior verification script)

---

## Key Decisions (Easy to Miss)

1. **SET NULL not CASCADE.** Convention #259 says completions "stay readable in audit views" — that requires the row to survive, with its step_id orphaned. CASCADE would destroy the audit trail.
2. **NULL step_ids filtered out at the consumer layer.** All four read-side consumers (`TaskCard`, `RoutineStepChecklist`, `GuidedActiveTasksSection`, plus `useRoutineWeekView` whose key construction is NULL-safe) build `Set<string>` and check `set.has(step.id)` against live step IDs. A NULL never matches a real step.id, so orphaned completions silently fail the membership check — exactly the desired audit-trail behavior.
3. **Error toast variant is additive.** Existing `routingToast.show({ message })` call sites stay untouched. New `variant: 'error'` opt-in only. UndoToast keeps `variant='success'` as the default.
4. **Error-toast dwell time is 10s.** Founder asked for ≥8s OR persist-until-clicked. 10s matches mom's reading speed for "Couldn't save changes" + decision time, and respects the existing pattern of auto-dismiss with a progress bar.
5. **Three save paths, one error contract.** `handleSave`, `handleSaveToStudio`, `handleEditConfirm` all wrap `await onSave` in `try { … } catch (err) { console.error('Routine save failed:', err); showErrorToast(ERROR_COPY) } finally { setLoading(false) }`. Modal stays open in every error case so mom's edits aren't lost.
6. **Frequency-rule normalization stays in TypeScript.** `serializeRoutineSectionsForRpc` does mwf/t_th expansion + custom-day sort/dedupe. The RPC stores whatever it's given. Keeps the SQL simple and the mapping unit-testable.
7. **`Tasks.tsx:handleEditTask` UPDATE-tasks error now throws.** Was `console.error + return`. Now throws so the c2 catch surfaces failures via the error toast — no more silent saves on the deployment-row update path either.
8. **`editingHandled` guard in `createTaskFromData`.** When `editingTemplateId` is set, the RPC call handles the entire section/step rewrite. The shared INSERT loop further down (used for fresh templates) skips this branch via `const editingHandled = !!data.editingTemplateId`.
9. **Empty step_notes normalized to NULL.** Both `''` and whitespace-only strings become NULL in the RPC payload, so `task_template_steps.step_notes` doesn't accumulate spurious empty-string rows.

---

## Stubs / Out of Scope

| Stub | Why deferred |
|---|---|
| Soft-delete instead of hard-delete for sections/steps | Out of scope — Convention #259 specifies orphan-with-NULL semantics, which SET NULL achieves with no schema migration on the parent tables. Soft-delete would require new `deleted_at` columns + cascade re-coding. |
| Updating `Tasks.tsx:handleCreateTask` (fresh task creation) to use the RPC | Out of scope — RPC is `update_routine_template_atomic`, not `create_or_update`. Fresh template creation continues using `createTaskFromData`'s existing INSERT path. |
| Section/step `id` preservation across edits | Out of scope — current behavior is "delete + reinsert with new ids," and orphan completions in audit are accepted. Identity preservation would be a separate refactor. |
| Migration application to production | Founder applies via `supabase db push` post-merge. Worker only authored migrations + verified locally. |

---

## Cross-Feature Connections

| This work... | Connects to... | Via |
|---|---|---|
| Migration 100177 unblocks step deletion | Master-template propagation contract (Convention #259) | FK behavior matches the convention prose |
| `UndoToast` error variant | Future error toasts platform-wide | New `variant: 'error'` is reusable for any save/route handler that needs error feedback |
| `update_routine_template_atomic` RPC | Future shared utilities | Pattern (SECURITY DEFINER + family-ownership RLS + JSONB payload) is reusable by Worker 4 LISTS-TEMPLATE-DEPLOY when it ships its equivalent for list templates |
| `serializeRoutineSectionsForRpc` | Future routine-edit surfaces | Any future flow that writes routine sections (e.g., LiLa-driven brain dump rewrites) can reuse the same serializer |

---

## Post-Build PRD Verification

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Step deletion no longer blocks routine edits | Worker prompt + Convention #259 | **Wired** | Migration 100177; FK = ON DELETE SET NULL |
| Convention #259 in compliance with live schema | Convention #259 | **Wired** | Schema now matches prose |
| Defensive guard against future CASCADE edit | Founder concern | **Wired** | `expect(sql).not.toMatch(/ON DELETE CASCADE/i)` test |
| `RoutineStepCompletion.step_id` typed as nullable | Type-system safety | **Wired** | `step_id: string \| null` |
| All consumer call sites filter NULL step_ids | Code audit | **Wired** | TaskCard, RoutineStepChecklist, GuidedActiveTasksSection updated; useRoutineWeekView key construction is NULL-safe by design |
| `handleSave` catch block | Worker prompt | **Wired** | Surfaces error toast + keeps modal open |
| `handleSaveToStudio` catch block | Worker flag-1 ask | **Wired** | Same shape as handleSave |
| `handleEditConfirm` catch block | Worker prompt | **Wired** | Same shape; preserves editConfirmState so mom can retry |
| `console.error('Routine save failed:', err)` in each catch | Worker prompt | **Wired** | All three paths |
| Error toast user-facing copy exact match | Worker prompt | **Wired** | "Couldn't save changes. Please try again or contact support." |
| Modal stays open on error | Worker prompt | **Wired** | No `onClose()` call inside catch |
| `UndoToast` variant prop | Worker flag-2 ask | **Wired** | `'success' \| 'error'`, default 'success' |
| Error variant ≥8s dwell or persist | Worker addition | **Wired** | 10s default |
| Error variant theme tokens (no hardcoded colors) | Convention #15 | **Wired** | `var(--color-error, #b91c1c)` with token-fallback pattern |
| Error variant accessibility | Implicit | **Wired** | role='alert' + aria-live='assertive' + AlertTriangle icon |
| `update_routine_template_atomic` RPC SECURITY DEFINER | Worker prompt | **Wired** | Migration 100178 |
| RLS check inside RPC | Worker prompt | **Wired** | family-ownership check via family_members lookup |
| GRANT EXECUTE to authenticated | Worker prompt | **Wired** | Migration 100178 |
| Single transaction for the rewrite | Worker prompt | **Wired** | Function body = single transaction by default |
| `createTaskFromData` editingTemplateId branch consolidated | Worker prompt | **Wired** | Replaces lines 128-161 + skips shared INSERT loop |
| `Tasks.tsx:handleEditTask` consolidated | Worker prompt | **Wired** | Replaces lines 282-346 |
| Both call sites share one path | Worker prompt | **Wired** | Both call `update_routine_template_atomic` |
| `Tasks.tsx:handleEditTask` throws on error | Worker prompt | **Wired** | UPDATE-tasks error + RPC error both throw; c2 catch surfaces both |
| Cache invalidation on `routine-template-steps` | Worker prompt implicit | **Wired** | Tasks.tsx adds the key alongside existing invalidations |
| Frequency-rule normalization in helper, not SQL | Architecture choice | **Wired** | `serializeRoutineSectionsForRpc` |
| C1 vitest passes | Worker prompt | **Wired** | 10/10 — `tests/routine-step-completions-set-null.test.ts` |
| C2 vitest passes | Worker prompt | **Wired** | 8/8 — `tests/task-creation-modal-save-error.test.tsx` |
| C3 vitest passes | Worker prompt | **Wired** | 24/24 — `tests/update-routine-template-atomic.test.ts` |
| DB-behavior verification scripts | Worker addition | **Wired** | Both new migrations have companion `tests/verification/*.ts` for founder local pre-merge run |
| `tsc -b` clean before each commit | Convention #121 | **Wired** | Verified before c1, c2, c3 |
| `npm run prebuild` clean before each commit | Convention #121 | **Wired** | 0 errors before c1, c2, c3 (73 pre-existing warnings, none introduced) |
| Convention #14 verification table (this file) | Convention #14 | **Wired** | This document |
| WIRING_STATUS.md updated | Convention #14 | **Wired** | New "Routine Save Reliability" section added |
| `claude/live_schema.md` regenerated | Convention #14 + #244 | **Wired** | Regenerated after both migrations; FK delete behavior is not captured in the dump format, so changes are timestamp/row-count refreshes only |
| `claude/feature-decisions/README.md` updated | Convention #14 | **Wired** | This file added to index |
| Convention #259 prose unchanged | Worker prompt | **Wired** | Live schema now matches the convention as written; prose required no edit |
| Production data spot-check | Worker prompt | **Wired** | `routine_step_completions`: 280/280 rows still have non-NULL step_id (migration 100177 not yet applied to prod, expected) |

### Summary
- Total requirements verified: **38**
- Wired: **38**
- Stubbed: **0**
- Missing: **0**

### Test counts
- New vitest: **42 / 42 pass** across 3 files (10 + 8 + 24)
- Full vitest suite: **545 / 553 pass** — the 8 failures pre-exist on main (`convention-lint`, `journal-notepad`, `personal-growth`); confirmed by running the same tests on main with identical results
- DB-behavior verification scripts (founder runs locally pre-merge): two `tests/verification/*.ts` files cover migration 100177 FK behavior + migration 100178 RPC happy-path / completion-survival / mid-flow rollback

### Known follow-ups
- Migration 100177 + 100178 await production application (`supabase db push`). Founder applies after review.
- Application code is forward-compatible — `createTaskFromData` and `Tasks.tsx:handleEditTask` will throw a clean error if the migrations haven't landed yet (RPC missing → "function does not exist"), and the c2 catch will surface that to mom as the error toast. No silent regression risk.

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] Both DB-behavior verification scripts run locally (`tests/verification/routine-step-completions-set-null.ts` + `tests/verification/update-routine-template-atomic.ts`)
- [ ] Migrations 100177 + 100178 applied to production via `supabase db push`
- [ ] Manual smoke test: edit a routine that has historical completions, confirm save persists end-to-end
- [ ] **Phase approved as complete**
- **Completion date:**
