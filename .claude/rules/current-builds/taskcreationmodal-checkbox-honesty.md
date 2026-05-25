# TaskCreationModal — Checkbox Honesty (Visible UI = Saved DB State)

## Status: ACTIVE (pending founder approval to dispatch code)

> Frontend bug fix. Same bug class as RoutineDeployModal commit `9523faa` (2026-05-23). Companion build: `prd-09b-living-shopping-list-shopping-mode.md` (post-build verification deferred — do not touch).
> Feature decision file: `claude/feature-decisions/TaskCreationModal-Checkbox-Honesty.md`.

---

## Source Material

### Reference commit (the proven pattern)
- `9523faa` — `fix: painted-routine deploys preserve rdates + Studio date display + checkbox honesty`. Specifically the `RoutineDeployModal.tsx` diff (+46/-26 lines) introducing `trackingInteractedRef = useRef(false)`, four setter wrappers, and the `if (trackingInteractedRef.current) return` guard inside the async template-fetch effect.

### Files read in full / in relevant sections
- `src/components/tasks/TaskCreationModal.tsx` (lines 1–400, 600–1000, 1300–1600, 2350–2650 — full handlers, tracking UI, re-init effect at 730–768, `makeupConfig` effect at 671–681, `update<K>()` helper at 799, `handleSave` at 823–1009, `handleSaveToStudio` at 1011–1055)
- `src/components/templates/RoutineDeployModal.tsx` (post-`9523faa` shape — `trackingInteractedRef` lines 134–192 + setter wrappers + JSX wiring at 540–600 confirmed via git show)
- `tests/routine-deploy-tracking-honesty.test.tsx` (full file — `TrackingHarness` shape, deferred-promise pattern, 5 race-condition test scenarios, 2 happy-path, 1 unmount-safety)
- `src/pages/Tasks.tsx:170` (`makeupConfig` state), `:877–882` (Create modal), `:964–990` (Edit modal — inline `editTaskValues={{...}}` object literal in JSX, the bug surface)
- `src/components/tasks/DashboardTasksSection.tsx:319–360` (Dashboard Edit modal — same inline `editTaskValues={{...}}` pattern)
- `src/components/queue/SortTab.tsx:583–596` (batch flow, no `editTaskValues`)
- `src/pages/Studio.tsx:1424–1442` (Customize flow, modal is conditionally rendered so it remounts each open)

### Conventions consulted
- **#14** (post-phase checklist Part A — verification table, Part B — file updates, mobile/desktop nav parity N/A here)
- **#121** (`npx tsc -b` clean — Vercel build mode, NOT `--noEmit`)
- `claude/PRE_BUILD_PROCESS.md` (this process)
- Founder rule from `9523faa` commit message: "Visible state IS the saved state. No silent overrides."

### Verified live behavior
- Tasks.tsx Edit modal: inline `editTaskValues={{...}}` is created fresh on every Tasks.tsx render. Any parent re-render (refetch, theme change, sibling state, etc.) produces a new object reference → current re-init effect at line 730 fires → `setData(d)` wipes mom's in-progress edits.
- DashboardTasksSection.tsx: same pattern, same bug.
- SortTab batch processing: `queueItem` and `activeBatchItem` come from local state and props; their `.id` properties are stable across non-id-changing parent renders. The current dep array catches batch advancement via `queueItem?.id` / `activeBatchItem?.id`. Must preserve.
- Studio Customize: modal conditionally mounted (`{modalOpen && <TaskCreationModal />}`) → useState initializer runs fresh each open → no re-init-effect bug surface for this caller.

---

## The Bug (Concise)

**File:** `src/components/tasks/TaskCreationModal.tsx`
**Effect:** lines 730–768 (`useEffect` with `setData(d)` overwrite)
**Dep array:** `[queueItem?.id, activeBatchItem?.id, initialTaskType, defaultTitle, defaultDescription, editTaskValues, deployFromTemplateId]`

The `editTaskValues` dep is an **unstable reference** — Tasks.tsx:976 and DashboardTasksSection.tsx:346 both pass it as an inline `{...}` JSX literal, so every parent re-render produces a new object identity even when the logical values are identical. React fires the effect, the effect calls `setData(d)` constructed from `defaultTaskData()` + `editTaskValues` hydration, and every form field — including the allowance/gamification/homework/extra-credit/track-progress/track-duration/allowance-points checkboxes mom just touched — snaps back to the underlying DB row's last-known value.

The effect ALSO legitimately needs to fire on:
- Batch advancement (`queueItem.id`/`activeBatchItem.id` change in SortTab)
- Edit-target swap (mom clicks Edit on a different task without closing the modal — Tasks.tsx line 965's `{editingTask && (...)}` conditional stays truthy across swaps)

Today both legitimate triggers and the illegitimate parent-rerender-noise trigger flow through the same effect and the same dep array. The fix distinguishes them.

---

## Fix Design (Mirror of RoutineDeployModal Pattern + Identity-Prop Adaptation)

### 1. `hasUserInteractedRef = useRef(false)`
Flipped `true` on any user input that mutates `data`. Wired into:
- `update<K>(key, val)` helper at line 799 — covers most write paths.
- Every direct `setData(d => ...)` / `setData(prev => ...)` call that represents user intent: `toggleMember`, `toggleFamily`, `setAssignMode`, member-pill button handlers, rotation toggle, opportunity sub-type radio, task-type picker (line 1448 `onClick`), assignmode change inside rotation handler.

### 2. Narrow the re-init effect's dependency array
**Before:**
```ts
}, [queueItem?.id, activeBatchItem?.id, initialTaskType, defaultTitle, defaultDescription, editTaskValues, deployFromTemplateId])
```
**After:**
```ts
}, [queueItem?.id, activeBatchItem?.id, editTaskId])
```
`editTaskId` is a new optional prop (`string | null`). Tasks.tsx and DashboardTasksSection.tsx pass `editingTask.id`. Other callers omit (their flows don't need stable-identity edit-target signaling).

### 3. Inside the re-init effect, on every legitimate fire:
- Reset `hasUserInteractedRef.current = false`.
- Then call `setData(d)` with the current (closure-fresh) `editTaskValues`, `defaultTitle`, etc. They're still read inside the effect body — just not in its dep array.
- Reset secondary state: `scheduleMode`, `quickDays`, `quickDate`, `showScheduler`, `showTypesExplained`, `showTaskBreaker`, `showTaskBreakerPanel`, `selectedIcon`.

### 4. Keep `useState(() => defaultTaskData(...))` initializer at line 630 unchanged
Already correctly hydrates from `editTaskValues`/`defaultTitle`/`defaultDescription`/`initialTaskType`/`initialRoutineSections`/`deployFromTemplateId` on mount. Once mount is done, those props become effectively mount-only — the form is mom's after first render.

### 5. `makeupConfig` adjacent effect (lines 671–681)
Add the same ref-guard inside its `if (makeupConfig && isOpen)` body. Skip the overwrite when mom has already interacted. Dep array `[makeupConfig, isOpen]` stays — that's a legitimate user-driven re-init.

### 6. `initialRoutineSections` merge effect (lines 771–775)
Unchanged. It uses `setData(prev => ({ ...prev, routineSections }))` so it doesn't clobber the rest of the form.

---

## Caller Changes

Only two callers need a one-line addition each:

### `src/pages/Tasks.tsx:966–989`
Add `editTaskId={editingTask.id}` to the Edit modal call site.

### `src/components/tasks/DashboardTasksSection.tsx:319–360`
Add `editTaskId={editingTask.id}` to the Edit modal call site.

No other callers need changes. The `editTaskId` prop is optional — omitting it preserves current behavior for SortTab, Studio Customize, and the Tasks Create modal.

---

## data-testid Additions (Selector Stability for Playwright)

Add to the four currently-untaggged checkbox inputs in `TaskCreationModal.tsx` Rewards & Tracking section:
- `data-testid="counts-for-allowance-checkbox"` (line 2424)
- `data-testid="counts-for-gamification-checkbox"` (line 2575)
- `data-testid="counts-for-homework-checkbox"` (line 2528)
- `data-testid="is-extra-credit-checkbox"` (line 2516)
- `data-testid="track-progress-checkbox"` (line 2405)
- `data-testid="track-duration-checkbox"` (line 2414)

`allowance-points-input` (line 2472) already has its testid.

---

## Test Plan

### Vitest (deterministic harness — primary proof of invariant)

**File:** `tests/task-creation-modal-checkbox-honesty.test.tsx` (NEW)

Pattern: a `CheckboxHonessyHarness` that mirrors the relevant slice of TaskCreationModal:
- `useState` for the affected fields (`countsForAllowance`, `countsForGamification`, `countsForHomework`, `allowancePoints`, `isExtraCredit`, `trackProgress`, `trackDuration`).
- `hasUserInteractedRef` flipped via wrapped setters.
- Re-init effect with the narrowed dep array on `[queueItemId, activeBatchItemId, editTaskId]`.

**Cases:**
1. **Parent-rerender noise does NOT clobber** — initial render with `editTaskValues={A}`, mom flips `countsForAllowance` to `false`, parent re-renders with `editTaskValues={A'}` (new reference, same logical values), assert checkbox stays `false`.
2. **Edit-target swap DOES re-init** — initial render with `editTaskId='task-1'`, mom flips `countsForGamification` to `false`, parent re-renders with `editTaskId='task-2'` + new `editTaskValues`, assert form re-hydrates from task 2's values and `hasUserInteractedRef` resets.
3. **Batch queueItem.id change DOES re-init** — initial render with `queueItemId='q1'`, mom flips `countsForHomework` to `true`, parent re-renders with `queueItemId='q2'`, assert form re-hydrates and ref resets.
4. **One-field interaction blocks hydration for ALL fields (shared ref)** — mom touches only `countsForAllowance`, parent re-renders with new `editTaskValues` carrying different values for all 7 fields, assert all 7 hold post-interaction values.

### Playwright E2E (UI round-trip happy path)

**File:** `tests/e2e/features/task-edit-checkbox-honesty.spec.ts` (NEW)

One spec:
- Open Tasks page as mom.
- Find a task, click Edit.
- Flip `data-testid="counts-for-allowance-checkbox"` to checked.
- Trigger a parent re-render (toggle a Tasks-page state — e.g. open/close a sibling drawer, or just wait 2s for any background query refetch).
- Assert checkbox is still checked.
- Click Save.
- Assert DB row has `counts_for_allowance=true` for that task.

If timing proves flaky, fall back to the vitest invariant as proof; founder said "DO NOT ship a flaky E2E."

---

## Mom-UI Surfaces

| Surface | Shells | New / Modification |
|---|---|---|
| TaskCreationModal — Edit mode tracking checkboxes (allowance, gamification, homework, extra-credit, track-progress, track-duration) | Mom (Tasks page edit modal, Dashboard edit modal) | Modification — behavioral fix, no visible UI change |
| TaskCreationModal — allowance_points input | Mom | Modification — same fix surface |
| TaskCreationModal — Reward Type dropdown + amount input | Mom | Modification — same fix surface (covered as collateral by the `update()` ref-guard) |
| TaskCreationModal — assignment pills + Any/Each toggle | Mom | Modification — same fix surface (collateral) |
| TaskCreationModal — task type picker (Task / Long Term / Routine / Opportunity / Habit / List) | Mom | Modification — same fix surface (collateral) |
| TaskCreationModal — makeup config flow (Create modal with `makeupConfig`) | Mom | Modification — adjacent effect gets same ref-guard |
| SortTab batch processing flow | Mom | Verify only — must preserve current behavior |
| Studio Customize flow | Mom | Verify only — modal remounts each open, no regression risk |

## Mom-UI Verification

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---|---|---|---|---|---|---|
| Tasks page Edit modal — flip allowance checkbox, parent re-render, save, verify DB | | | | Mom | | |
| Tasks page Edit modal — flip gamification checkbox, parent re-render, save, verify DB | | | | Mom | | |
| Tasks page Edit modal — flip homework checkbox, parent re-render, save, verify DB | | | | Mom | | |
| Tasks page Edit modal — flip track-progress checkbox, parent re-render, save, verify DB | | | | Mom | | |
| Tasks page Edit modal — flip track-duration checkbox, parent re-render, save, verify DB | | | | Mom | | |
| Tasks page Edit modal — flip extra-credit (with allowance on), parent re-render, save, verify DB | | | | Mom | | |
| Tasks page Edit modal — set allowance_points, parent re-render, save, verify DB | | | | Mom | | |
| Dashboard Edit modal — same matrix as above (subset — verify 1 checkbox round-trip) | | | | Mom | | |
| Tasks page — switch edit target task A → task B without closing modal — verify form re-hydrates | | | | Mom | | |
| SortTab batch flow — process 2+ queue items in sequence, each item's checkboxes should re-init from defaults | | | | Mom | | |
| Studio Customize flow — open Customize on a Routine template, edit a step, save — no regression | | | | Mom | | |
| Tasks Create modal with makeupConfig — flip allowance checkbox, verify it stays flipped | | | | Mom | | |

---

## Build Order

1. **Add `editTaskId` prop to TaskCreationModalProps type** + plumb through props destructure.
2. **Add `hasUserInteractedRef = useRef(false)`** at the top of the component body.
3. **Refactor `update<K>(key, val)` helper** to flip the ref before calling `setData`.
4. **Refactor all user-input `setData(...)` call sites** to flip the ref (toggleMember, toggleFamily, setAssignMode, rotation handlers, opportunity sub-type radio, task-type picker, etc.).
5. **Narrow the re-init effect's dep array** to `[queueItem?.id, activeBatchItem?.id, editTaskId]`. Inside the effect body, reset `hasUserInteractedRef.current = false` before calling `setData(d)`.
6. **Add ref-guard to `makeupConfig` effect** at lines 671–681.
7. **Add `editTaskId={editingTask.id}`** to Tasks.tsx:966–989 and DashboardTasksSection.tsx:319–360 call sites.
8. **Add `data-testid` attributes** to the 6 affected checkboxes in the Rewards & Tracking section.
9. **Write the vitest harness** at `tests/task-creation-modal-checkbox-honesty.test.tsx`.
10. **Write the Playwright E2E** at `tests/e2e/features/task-edit-checkbox-honesty.spec.ts`.
11. **Run `npx tsc -b`** — verify zero errors (Convention #121).
12. **Run `npm run lint`** — verify zero new errors (`no-restricted-syntax`, `react-hooks/rules-of-hooks`).
13. **Run the vitest suite** locally — all 4 cases pass deterministically.
14. **Run the Playwright spec** — passes on at least 3 consecutive runs without flake. If flaky, drop it and rely on the vitest invariant.
15. **Populate the Mom-UI Verification table** above with eyes-on screenshots / timestamps.
16. **Founder Sign-Off** — present the verification table for explicit approval before commit.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Missing a `setData(d => ...)` call site in the JSX, leaving a path where mom's input doesn't flip the ref | Medium | High (residual bug, same class) | Grep the file exhaustively for `setData(` before signing off. Make a checklist of every call site found. |
| Narrowing the dep array breaks Studio Customize "Edit" flow that re-uses the modal for editing routine templates | Low | Medium | Studio uses `editingTemplateId`, not `editTaskId`. The Studio path conditionally remounts the modal (`{modalOpen && <TaskCreationModal />}`), so re-init effect never fires mid-edit there. Verify with a Customize → edit → re-open round-trip. |
| `editTaskId` is undefined for Tasks Create modal (no `editingTask`) — effect fires only on mount; new task creation might re-init unexpectedly if parent re-renders | Low | Medium | Effect's dep is `[queueItem?.id, activeBatchItem?.id, editTaskId]`. For Create modal: all three are `undefined`, none change after mount → effect only fires on mount (the initial useEffect run) → setData runs with current state which equals the useState initializer output → no-op overwrite. Verify by hand-tracing. |
| `hasUserInteractedRef` doesn't reset on legitimate batch advancement → batch item 2 inherits mom's interaction state from item 1 | Low | Medium | The effect resets `hasUserInteractedRef.current = false` BEFORE calling `setData(d)`. Explicit. Covered by vitest case 3. |
| Playwright timing flake on "wait for parent re-render" before re-asserting checkbox state | Medium | Low | Use an explicit parent-re-render trigger (toggle a sibling state) rather than `await page.waitForTimeout()`. If still flaky, drop the spec. |
| Adding `editTaskId` prop requires type updates in callers; TypeScript strict mode may surface unrelated type issues | Low | Low | `editTaskId?: string \| null` is optional. No breaking change. Verify `npx tsc -b` clean. |

---

## Pre-Build Founder Sign-Off Required

Before any code is written:
- [ ] Bug surface enumeration confirmed (full form-field clobber list, not just tracking flags)
- [ ] Caller inventory confirmed (Tasks Edit + Dashboard Edit are primary; others are spot-check / preserve-behavior)
- [ ] Fix design approved — `hasUserInteractedRef` + narrowed dep array + new `editTaskId` prop
- [ ] Scope of `setData(...)` instrumentation confirmed (all user-input mutations, not just tracking flags)
- [ ] `makeupConfig` adjacent effect in-scope confirmed
- [ ] Test plan confirmed (4 vitest cases + 1 Playwright E2E; drop E2E if flaky)
- [ ] data-testid additions on 6 checkboxes approved
- [ ] No convention text update this build (deferred — see feature decision file Stubs)
- [ ] **Approved to dispatch code**

## Post-Build Founder Sign-Off (after Mom-UI Verification table is fully ✅)

- [ ] Verification table reviewed
- [ ] Zero Missing in Post-Build Verification table (feature decision file)
- [ ] `npx tsc -b` clean
- [ ] `npm run lint` clean
- [ ] Vitest suite passes deterministically
- [ ] Playwright spec passes (or has been explicitly dropped as flaky)
- [ ] **Approved to commit**
- [ ] **Approved to push** (separate confirmation)
