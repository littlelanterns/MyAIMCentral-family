# Feature Decision: TaskCreationModal — Checkbox Honesty (Visible UI = Saved DB State)

> **CLOSED 2026-06-04 (close-out tidy; build-file status was stale).** Code shipped 2026-05-25 (`970e175`), committed + pushed, in production. Fix verified present: `hasUserInteractedRef` + `editTaskId` instrumentation (13 markers in TaskCreationModal.tsx); vitest harness `tests/task-creation-modal-checkbox-honesty.test.tsx` present. Planned Playwright E2E intentionally dropped per plan ("drop if flaky" — vitest invariant is the proof). Build file archived to `.claude/completed-builds/2026-06/`.

> **Created:** 2026-05-25
> **PRD:** Not PRD-driven. Bug fix. Reference convention: founder rule "visible UI state IS the saved DB state. No silent overrides."
> **Companion / proven pattern:** `src/components/templates/RoutineDeployModal.tsx` + `tests/routine-deploy-tracking-honesty.test.tsx` (commit `9523faa`, 2026-05-23).
> **Addenda read:** None directly. Conventions consulted: #14 (post-phase checklist), #121 (`npx tsc -b` clean before declare done), `claude/PRE_BUILD_PROCESS.md`, founder's "checkbox honesty" rule restated in commit message of `9523faa`.
> **Founder approved:** *(pending)*

---

## What Is Being Built

A behavioral fix to `src/components/tasks/TaskCreationModal.tsx` that closes the same bug class as commit `9523faa` closed for `RoutineDeployModal.tsx`. Today, a `useEffect` at TaskCreationModal lines 730–768 calls `setData(d)` — overwriting the **entire form** — whenever its `editTaskValues` prop changes reference. Because both callers (`Tasks.tsx:976`, `DashboardTasksSection.tsx:346`) pass `editTaskValues` as an inline object literal in JSX, every parent re-render produces a fresh reference. Result: mom checks "Count toward allowance" mid-edit, the parent re-renders for any unrelated reason, and the checkbox silently flips back to whatever the underlying DB row said — without mom seeing it happen, without a save-attempt confirming what was actually persisted. The fix restores the invariant: **visible state = saved state**.

---

## Bug Surface (full set of form fields the re-init effect overwrites)

The current re-init effect calls `setData(d)` with a freshly-constructed `CreateTaskData` object at line 759, then resets a half-dozen secondary `useState`s. Every field below is currently at risk of being clobbered if the effect fires while mom is mid-edit. This list is exhaustive — not just the allowance/gamification/homework flags called out in the bug ticket.

**Primary form state (`setData(d)`):**
- `title`, `description`, `durationEstimate`, `customDuration`, `lifeAreaTag`, `customLifeArea`, `imageUrl`
- `taskType` (also overwritten by the `initialTaskType` branch above)
- `opportunitySubType`, `maxCompletions`, `claimLockDuration`, `claimLockUnit`, `routineSections`
- `assignments`, `wholeFamily`, `assignMode`, `rotationEnabled`, `rotationFrequency`
- `schedule`, `incompleteAction`
- `reward` (full object — `rewardType`, `rewardAmount`, `bonusThreshold`, `bonusPercentage`, `requireApproval`, `trackAsWidget`, `flagAsVictory`)
- `listSource`, `linkedListId`, `listDeliveryMode`, `newListName`, `newListItems`
- `dueDate`, `startDate`, `scheduleMode`, `weeklyDays`
- `saveAsTemplate`, `templateName`, `templateOnly`, `editingTemplateId`, `deployFromTemplateId`
- `sourceQueueItemId`, `sourceBatchIds`, `source`, `sourceReferenceId`
- `taskBreakerSubtasks`, `taskBreakerLevel`
- `iconAssetKey`, `iconVariant`
- **`countsForAllowance`, `countsForHomework`, `countsForGamification`, `allowancePoints`, `isExtraCredit`**
- **`trackProgress`, `trackDuration`**
- `homeworkSubjectIds`, `rewardRevealConfig`

**Secondary state setters (lines 760–767):**
- `scheduleMode`, `quickDays`, `quickDate`
- `showScheduler`, `showTypesExplained`, `showTaskBreaker`, `showTaskBreakerPanel`
- `selectedIcon`

**Adjacent effect (lines 671–681) — makeup work pre-config:**
- Calls `setData(prev => ...)` setting `taskType='makeup'`, `countsForAllowance=true`, `countsForGamification=false`, and `assignments=[{makeupConfig.assigneeId}]`.
- Deps: `[makeupConfig, isOpen]`.
- `makeupConfig` is a `useState`-managed object in `Tasks.tsx:170`, so the reference is stable across re-renders unless mom explicitly clears or re-sets. **Lower risk than the main effect**, but the same bug class. In-scope for spot-check; full re-architecture only if smoke test surfaces a regression.

---

## Caller Inventory and Re-Init Triggers

| Caller | File:Line | Passes `editTaskValues`? | Passes `queueItem`/batch? | Mid-edit re-render produces fresh reference? | In-scope for this fix |
|---|---|---|---|---|---|
| Tasks edit modal | `src/pages/Tasks.tsx:966–989` | ✅ Inline `{...}` literal | No | **Yes — every parent render** | Yes (primary bug surface) |
| Dashboard edit modal | `src/components/tasks/DashboardTasksSection.tsx:319–359` | ✅ Inline `{...}` literal | No | **Yes — every parent render** | Yes (primary bug surface) |
| Tasks create modal | `src/pages/Tasks.tsx:877–882` | ❌ | No (takes `makeupConfig`) | n/a for `editTaskValues` | Yes for `makeupConfig` adjacent effect |
| SortTab queue processing | `src/components/queue/SortTab.tsx:584–596` | ❌ | ✅ `queueItem`, `batchMode`, `batchItems` | n/a — batch re-init is **legitimate** intent | Yes (must preserve batch behavior) |
| Studio Customize/Edit | `src/pages/Studio.tsx:1424–1442` | ❌ | No | n/a — modal is conditionally rendered (`{modalOpen && ...}`), remounts each open | No regression risk |

**Legitimate re-init triggers (effect MUST fire):**
1. Batch mode advancing to next queue item (`queueItem.id` or `activeBatchItem.id` change).
2. Mom switches the modal from editing task A to editing task B without closing it in between (parent calls `setEditingTask(taskB)`). Today this is detected by `editTaskValues` reference change — which is the same signal as "parent re-rendered." The fix needs a stable identity signal to distinguish.

**Illegitimate re-init triggers (effect MUST NOT fire):**
3. Parent re-renders for any reason while same logical edit-target is active (refetched task data, theme change, sibling-component state change, etc.). Today this clobbers mom's in-progress edits.

---

## The Fix — Adapted from RoutineDeployModal

The proven pattern in `RoutineDeployModal.tsx` (post-`9523faa`) is:
1. `trackingInteractedRef = useRef(false)` flipped `true` on any user input via setter wrappers.
2. The post-mount async fetch effect checks `if (trackingInteractedRef.current) return` before writing.
3. Once mom interacts, the late template-defaults write bails entirely.

That pattern works for RoutineDeployModal because its hydration effect is one-shot with a stable dep array (`[template.id, mode]`). TaskCreationModal's re-init effect is structurally harder because:

- It deliberately re-fires on batch queueItem advancement (legitimate).
- It must still hydrate from `editTaskValues` on mount and on task-swap (legitimate).
- It must NOT fire on parent-re-render noise (illegitimate — the bug).

**Adapted pattern (subject to founder approval — see "Open Questions" below):**

1. **Add `hasUserInteractedRef = useRef(false)`** flipped `true` on any user input.
   - Hook into the central `update<K>(key, val)` helper at line 799 (covers most input paths).
   - Hook into every site that calls `setData(d => ...)` directly with mom's intent — `toggleMember`, `toggleFamily`, `setAssignMode`, rotation/assignMode inline handlers, the assignment row member-pill button handlers, and any field-specific `setData` callbacks inside the JSX.

2. **Narrow the re-init effect's dependency array** from the current 7 deps:
   ```ts
   [queueItem?.id, activeBatchItem?.id, initialTaskType, defaultTitle, defaultDescription, editTaskValues, deployFromTemplateId]
   ```
   to an identity-only signature:
   ```ts
   [queueItem?.id, activeBatchItem?.id, editTaskId]
   ```
   where `editTaskId` is a **new optional prop** (`string | null`) that callers pass when they want to signal "this is a different edit target." Tasks.tsx and DashboardTasksSection.tsx pass `editingTask.id`; everyone else omits.

3. **Inside the re-init effect, on every legitimate fire:**
   - Reset `hasUserInteractedRef.current = false`.
   - Then call `setData(d)` and reset the secondary state setters.
   - This means batch advancement and task-swap both work correctly — the ref is reset so mom's next interaction on the new item is fresh, and the new item's defaults flow in.

4. **Keep the `useState(() => ...)` initializer at line 630 unchanged.** It already hydrates from `editTaskValues`/`defaultTitle`/`defaultDescription`/`initialTaskType`/`initialRoutineSections`/`deployFromTemplateId` on mount. With the narrowed dep array, these props become **mount-only** — the modal honors them on first render but stops re-hydrating from them on parent re-renders. This is the correct behavior; once mom is editing, the form is hers.

5. **The `makeupConfig` adjacent effect** (lines 671–681) gets the same `hasUserInteractedRef` guard inside its `if (makeupConfig && isOpen)` body: if mom has already interacted, skip the overwrite. The dep array stays `[makeupConfig, isOpen]` because that's a legitimately user-driven re-init (toggling makeup mode on a fresh modal open).

6. **The `initialRoutineSections` merge effect** (lines 771–775) is fine as-is — it uses `setData(prev => ({ ...prev, routineSections: ... }))` so it doesn't clobber the rest of the form, and it only fires when `initialRoutineSections` arrives async. No change needed.

---

## Open Questions (For Founder)

1. **Adding a new `editTaskId` prop to TaskCreationModal:** OK to add? It's optional, only used by Tasks.tsx and DashboardTasksSection.tsx for stable-identity signaling. Strictly additive — no breaking changes. Alternative: rely on `editingTemplateId` as the identity signal, but routine edits with the same template re-deployed twice would conflate. Cleanest is a dedicated prop.

2. **Scope of `update()` wrapper instrumentation:** the `update<K>(key, val)` helper at line 799 is the most common write path, but there are ~15–20 inline `setData(d => ...)` and `setData(prev => ...)` calls scattered through the JSX (member pill toggles, assignMode segmented control, rotation toggles, opportunity sub-type radio, task-type picker, etc.). The cleanest fix wraps `update()` AND every direct `setData` that represents mom's input. Confirm: all direct `setData` mutations from user UI interactions are in-scope, or just the tracking-flag write paths from the bug ticket?

3. **`makeupConfig` effect:** in-scope to add the same `hasUserInteractedRef` guard, or leave it alone since the structural risk is lower? Recommendation: in-scope for completeness — it costs almost nothing once the ref is established and closes a latent bug.

4. **Tests:** the deferred-promise harness from `tests/routine-deploy-tracking-honesty.test.tsx` doesn't apply directly here because the bug isn't an async race — it's a synchronous re-render race. The harness pattern adapts to: mount → mom flips checkbox → parent passes new editTaskValues reference (no value change) → assert checkbox state holds. Plus a real-component vitest harness for the batch advancement legitimate flow. Confirm test surface: 4 unit tests covering (a) parent-re-render noise doesn't clobber, (b) batch queueItem.id change DOES re-init, (c) editTaskId change DOES re-init, (d) `makeupConfig` adjacent flow. Plus 1 Playwright E2E covering UI round-trip on the edit modal.

5. **Playwright selector stability:** the allowance checkbox at line 2425–2434 has no `data-testid`. The `allowance-points-input` at line 2472 has one. Adding `data-testid="counts-for-allowance-checkbox"` and matching IDs for gamification/homework/extra-credit checkboxes is the safest path. OK to add?

---

## Database Changes Required

**None.** This is a frontend behavior fix. No schema, no migration, no RLS, no feature keys.

---

## Feature Keys

**None.** No new feature gating.

---

## Stubs — Do NOT Build This Phase

- [ ] Refactor of the `setData(d => ...)` inline call sites into a single `useReducer` — out of scope. The bug fix doesn't require it.
- [ ] Rewriting `editTaskValues` callers (Tasks.tsx, DashboardTasksSection.tsx) to memoize the inline object via `useMemo` — alternative fix path, NOT chosen. The chosen path adds `editTaskId` and narrows the effect's dep array, which is more robust against future inline-object regressions.
- [ ] Audit of every other modal in the codebase for the same bug class — out of scope. If a future audit surfaces another modal with this pattern (`useState` initializer + re-init `useEffect` on unstable parent props), file a separate ticket.
- [ ] Convention text update in `claude/conventions.md` documenting the "visible UI = saved DB state" rule with a code anti-pattern callout — proposed as a Convention #14 Part B post-build item, gated on founder approval of the wording.

---

## Cross-Feature Connections

| This fix... | Direction | Connected to... | Via |
|---|---|---|---|
| `TaskCreationModal` re-init guard | → | `src/pages/Tasks.tsx` Edit modal call site | Adds optional `editTaskId` prop |
| `TaskCreationModal` re-init guard | → | `src/components/tasks/DashboardTasksSection.tsx` Edit modal call site | Adds optional `editTaskId` prop |
| `TaskCreationModal` re-init guard | ← | `src/components/queue/SortTab.tsx` batch flow | No change required — batch advancement still detected via `queueItem.id`/`activeBatchItem.id` |
| `TaskCreationModal` re-init guard | ← | `src/pages/Studio.tsx` Customize flow | No change required — modal is conditionally rendered, remounts each open |

---

## Things That Connect Back to This Feature Later

- Any future modal that hydrates from a parent-passed object and has a re-init useEffect should follow this same `hasUserInteractedRef` + narrow-dep-array + stable-identity-prop pattern. Worth a convention text update post-build (see Stubs).
- If `PRD-09A Daily Progress Marking` ever adds new tracking-flag fields to the modal (e.g. a future per-task pool override beyond `allowancePoints`), the same ref-based guard automatically protects them — no extra wiring required.

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] Bug surface enumerated correctly — all form fields are protected, not just the tracking flags
- [ ] Caller inventory complete — Tasks edit, Dashboard edit, Tasks create+makeup, SortTab batch, Studio Customize
- [ ] Open questions answered (1–5 above)
- [ ] Test scope confirmed — 4 vitest cases + 1 Playwright E2E
- [ ] Selector additions approved (data-testid on the affected checkboxes)
- [ ] **Approved to build**

---

## Post-Build PRD Verification

*Populated after build, before declaring complete.*

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Visible UI state survives parent re-render of `editTaskValues` reference (Tasks.tsx edit modal) | Bug ticket + founder rule | Wired / Stubbed / Missing | |
| Visible UI state survives parent re-render of `editTaskValues` reference (DashboardTasksSection edit modal) | Bug ticket + founder rule | Wired / Stubbed / Missing | |
| Batch queueItem advancement still re-inits form correctly (SortTab) | Existing behavior, must be preserved | Wired / Stubbed / Missing | |
| Switching edit target (task A → task B) re-inits form correctly | Founder rule + caller inventory | Wired / Stubbed / Missing | |
| First-mount hydration from `editTaskValues` still works | useState initializer at line 630 | Wired / Stubbed / Missing | |
| `makeupConfig` adjacent effect respects same ref-guard | Spot-check in scope | Wired / Stubbed / Missing | |
| All form fields protected — not just tracking flags | Full bug surface (see above) | Wired / Stubbed / Missing | |
| `npx tsc -b` clean (Convention #121) | CLAUDE.md | Wired / Stubbed / Missing | |
| 4 vitest unit cases pass deterministically | Test scope | Wired / Stubbed / Missing | |
| 1 Playwright E2E passes (UI round-trip) | Test scope | Wired / Stubbed / Missing | |
| No mobile/desktop nav parity required (no new top-level page) | Convention #14/#16 | N/A | |

**Status key:** Wired = built and functional · Stubbed = in `STUB_REGISTRY.md` · Missing = incomplete

### Summary
- Total requirements verified:
- Wired:
- Stubbed:
- Missing: **0**

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs (none expected) are acceptable for this phase
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
