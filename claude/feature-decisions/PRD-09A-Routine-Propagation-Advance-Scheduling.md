# Feature Decision File: PRD-09A — Routine Propagation, Advance Scheduling, and Duplicate-Rename

> **Created:** 2026-04-25
> **PRD:** `prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md`
> **PRD-09B (cross-ref):** `prds/personal-growth/PRD-09B-Lists-Studio-Templates.md` (lists side audited and deferred)
> **Addenda read:**
>   - `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md`
>   - `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md`
> **Founder approved:** 2026-04-25 (D1–D6 + naming requirement + overlap toast refinement)
> **Worker:** ROUTINE-PROPAGATION
> **Branch:** `worker/routine-propagation`

---

## What Is Being Built

This worker closes seven founder-flagged gaps in the routine deployment + propagation flow:

1. **Advance scheduling** — mom can deploy a routine "starting later" (toggle OFF by default = today; toggle ON reveals a date picker).
2. **Advance-start gating** — `recurringTaskFilter` hides routines whose `dtstart` is in the future, on both RRULE and per-section-frequency code paths.
3. **Master-template edit confirmation** — when mom edits a routine template that's deployed to N family members, a modal names every affected member and asks her to confirm before propagating the edit.
4. **Duplicate-and-rename** — Studio's Duplicate button now opens a chooser ("Copy and Customize" lands a new template in My Customized; "Assign Additional Member" deploys to another family member — existing flow). Both share a new deep-clone primitive.
5. **Scheduled-to-start badge** — small pill on Studio cards and Tasks-page routine cards when `dtstart > today`. Mom sees at a glance which routines are queued.
6. **Post-save toasts** — every routine-template save path now confirms what happened, anti-panic UX.
7. **Overlap detection** (founder D5 rescope) — the routine uniqueness rule is "no overlapping date ranges per (template, assignee)" not "one active per pair." Sequential non-overlapping deployments to the same family member are legitimate. New `RoutineOverlapResolutionModal` surfaces the warm "which days?" copy with three resolution options + "Open existing routine" deep link. Postgres trigger as backstop.

Additionally, Lists template deployment was audited and **deferred** to a separate Lists-focused worker per founder D6 Thread 2. See `Lists-Template-Deploy-Decisions-Needed.md`.

Two dispatch documents authored for the next workers in line: `Lists-Template-Deploy-Decisions-Needed.md` and `Shared-Assignment-Model-Worker-Handoff.md`.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| TaskCreationModal — routine SectionCard | New "Schedule to start later" Toggle + date picker (c2). Hidden when editing master template. |
| RoutineOverlapResolutionModal | New (c2.5). Three options: Replace / Keep both, adjust dates / Cancel. "Open existing routine" deep link. |
| MasterTemplateEditConfirmationModal | New (c3). Names every affected family member. Past-completions reassurance subtext. |
| RoutineDuplicateChooserDialog | New (c4). Single duplicate entry point. "What would you like to do with [name]?" → Copy and Customize / Assign Additional Member. |
| RoutineDuplicateTemplateDialog | New (c4). Name input only. Lands clone in My Customized for editing before assigning. |
| RoutineDuplicateDialog | Existing — refactored to use shared `cloneRoutineTemplate` utility. |
| ScheduledStartBadge | New (c5). Renders only when dtstart > today. Two sizes: full / compact. |
| CustomizedTemplateCard | Updated (c5). Renders `ScheduledStartBadge` next to type pill when next deployment is future-dated. |
| TaskCard | Updated (c5). Renders `ScheduledStartBadge` (compact) inline below task title for routines. |
| Studio "My Customized" cards | New "What would you like to do?" chooser opens on tap of Duplicate. |
| RoutingToastProvider | Reused (c6) for all post-save success toasts — anti-panic UX. |

---

## Key PRD Decisions (Easy to Miss)

1. **Advance scheduling persists in `recurrence_details.dtstart`** on the JSONB (founder D1). No new schema column. Same field both per-section-frequency routines (no rrule) AND RRULE routines use.
2. **"Schedule to start later" toggle is OFF by default** (founder D2). When off, `buildTaskScheduleFields` silently writes `dtstart = familyToday`. Match existing Toggle pattern from `@/components/shared`.
3. **Confirmation modal copy names affected members** (founder D3). "Saved — updated 3 active routines: Ruthie, Mosiah, and Gideon." Past-completions reassurance: "Past completions stay as-is — only future routine days reflect the change."
4. **Single duplicate button → chooser dialog** (founder D4 + Convention #255). Not two parallel buttons. Founder copy preserved verbatim: "What would you like to do with [Routine Name]?" / "Copy and Customize" / "Assign Additional Member".
5. **Overlap rule: no overlapping date ranges, NOT no duplicate active rows** (founder D5 rescope). Sequential non-overlapping deployments are legitimate — summer routine Aug 1–31, fall routine Sept 1–onwards, both for Mosiah, both pointing at the same template.
6. **"Open existing routine" deep link** in overlap modal (founder D5 refinement). Don't make mom hunt.
7. **NO "kid" or "child" anywhere in user-facing copy** (founder naming requirement). Use "family member" / "[Name]" / "member". These flows serve mom and dad too.
8. **Master template edits propagate live via `template_id` join** on `task_template_sections` and `task_template_steps`. Task-level fields (`title`, `description`, `due_date`, `dtstart`, `assignee_id`) snapshot on the deployed `tasks` row at deploy time — those do NOT propagate. Past `routine_step_completions` survive structural edits because they key on `step_id`. (New convention added in c8.)
9. **Convention #257 compliance** — all date writes route through `fetchFamilyToday` / `family_today` RPC. No `todayLocalIso()` client writes anywhere in the new code.
10. **Trigger as backstop, application as warm path** — overlap detection runs in both layers. Application pre-checks via `detectRoutineOverlap` to surface the modal; the Postgres trigger raises if any non-UI write path bypasses the rule.

---

## Addendum Rulings

### From PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md:
- Convention #255 (wizard friction-mapping, single-button-with-chooser pattern) directly informs founder D4. The Studio Duplicate button → chooser dialog implementation honors this.
- "Studio is the universal creation and library surface" — the ScheduledStartBadge surfaces on both Studio (My Customized) and Tasks page so the same routine reads identically across surfaces.

### From PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md:
- Linked-step semantics (sequential / randomizer / recurring_task sources) preserved through the deep-clone path. `cloneRoutineTemplate` accepts `linkedStepResolutions` for per-step source remapping; default (omitted) means linked steps share progress with the source. `RoutineDuplicateDialog` (Assign Additional Member flow) preserves the existing per-linked-step picker.

### From founder D5 rescope (2026-04-25 conversation, captured in this build's prompt):
- Three-tier worker dispatch sequence — this Worker 1 lands shared utilities + dispatch docs; Worker 2 SHARED-ROUTINES + Worker 3 SHARED-LISTS ship next; Worker 4 LISTS-TEMPLATE-DEPLOY closes the lists gap last.

---

## Database Changes Required

### Migration 100176 — `routine_assignment_overlap_check.sql`

- **DROP INDEX** `tasks_unique_active_routine_per_assignee` (the strict one-active-per-pair unique index from migration 100152). Replaced with a stricter-but-workflow-correct trigger.
- **CREATE FUNCTION** `prevent_overlapping_routine_assignments()` — fires `BEFORE INSERT OR UPDATE OF` on specific overlap-relevant columns. Computes the row's date range from `recurrence_details->>'dtstart'` (with `created_at` fallback for legacy rows) and `due_date` (NULL = +infinity). Compares against every other active row for the same `(template_id, assignee_id)` pair. Raises `exclusion_violation` on overlap with HINT pointing at `detectRoutineOverlap`.
- **CREATE TRIGGER** `trg_prevent_overlapping_routine_assignments` on `public.tasks`.
- **Smoke-test DO block** emits `NOTICE` (does NOT abort) when pre-existing overlapping rows exist — production data already exists; trigger only fires on future writes.

No other schema changes. `recurrence_details.dtstart` already has the JSONB shape we need.

---

## Feature Keys

No new feature keys for this build. Routine deployment + scheduling lives under existing `tasks_routines` and Studio surfaces.

---

## Stubs — Do NOT Build This Phase

| Stub | Why deferred |
|---|---|
| List-template deploy wiring | Founder D6 Thread 2 — separate Lists worker. See `Lists-Template-Deploy-Decisions-Needed.md`. |
| Shared-routine completion / completer-color rendering | Founder D6 Thread 3 — Worker 2 SHARED-ROUTINES. See `Shared-Assignment-Model-Worker-Handoff.md`. |
| Playwright e2e for the +7-day flow | Vitest covers the persistence math + filter logic. Visual confirmation deferred to founder review per `claude/PRE_BUILD_PROCESS.md` Visual Verification Standard. |
| Cross-feature `dateRangesOverlap` reuse on lists | N/A in v1 — lists don't have date ranges yet. The `dateRangesOverlap` predicate is exported separately so it's available when Worker 4 LISTS-TEMPLATE-DEPLOY ships. |

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Persists `dtstart` | → | `recurringTaskFilter` (Tasks page, dashboards) | `tasks.recurrence_details->>'dtstart'` JSONB |
| Reads active deployments | ← | `tasks` table | `template_id` foreign key, status filter |
| Writes archive on overlap-replace | → | `tasks.archived_at` | `RoutineOverlapResolutionModal` 'replace' branch |
| Surfaces post-save toasts | → | `RoutingToastProvider` | `useRoutingToast()` hook |
| Reuses overlap math | → | Convention #257 family_today RPC | `fetchFamilyToday(currentMember.id)` for dtstart pre-check |
| Shares deep-clone | → | (future) Worker 4 LISTS-TEMPLATE-DEPLOY | `src/lib/templates/` shape (not the function itself) |
| Shares badge | → | (future) shared lists with advance scheduling | `ScheduledStartBadge` from `src/components/templates/` |

---

## Things That Connect Back to This Feature Later

- **Worker 2 SHARED-ROUTINES** will read this build's advance-start + overlap detection on `is_shared=true` rows. The c1 vitest already audits is_shared=true paths to confirm no regression.
- **Worker 3 SHARED-LISTS** will follow the same shared-utility pattern — `src/lib/templates/` and `src/components/templates/` are intentionally cross-feature.
- **Worker 4 LISTS-TEMPLATE-DEPLOY** will fork (or wrap) `cloneRoutineTemplate` into `cloneListTemplate`, reuse `MasterTemplateEditConfirmationModal` if D-L3 = yes, and reuse `ScheduledStartBadge` if D-L5 = yes.
- **Future advance-scheduling on tasks** (one-time + recurring non-routine): the `recurrence_details.dtstart` pattern is now the canonical home and `recurringTaskFilter` already honors it across all task types.

---

## Founder Confirmation (Pre-Build)

- [x] Pre-build summary reviewed and accurate (Phase 1 audit + Phase 2 plan, 2026-04-25)
- [x] All addenda captured above
- [x] Stubs confirmed — nothing extra will be built
- [x] Schema change correct (only migration 100176 — no new columns)
- [x] **Approved to build** (D1–D6 green-light, 2026-04-25)

---

## Post-Build PRD Verification

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Advance-start gating on RRULE routines | Founder Row 2(a) | **Wired** | `recurringTaskFilter` honors `recurrence_details.dtstart` via RRule.between window |
| Advance-start gating on per-section-frequency routines | Founder Row 2(b) | **Wired** | New early-return check before line 44 in `recurringTaskFilter` |
| "Schedule to start later" toggle | Founder Row 1 + D2 | **Wired** | Toggle from `@/components/shared`, hidden when editing master template |
| `recurrence_details.dtstart` persistence | Founder D1 | **Wired** | `buildTaskScheduleFields` routine branch always emits dtstart (familyToday default) |
| Master-template edit confirmation modal | Founder Row 3 + D3 | **Wired** | `MasterTemplateEditConfirmationModal` w/ count + names + Oxford comma |
| Confirmation fires on Save Changes path | Founder D3 | **Wired** | TaskCreationModal `handleSave` pre-check |
| Confirmation fires on Save to Studio path | Founder D3 | **Wired** | TaskCreationModal `handleSaveToStudio` pre-check |
| 0 deployments → silent save (no modal) | Founder D3 | **Wired** | Pre-check returns no rows → falls through to onSave |
| Past completions reassurance subtext | Founder D3 | **Wired** | One-line subtext in modal copy |
| Studio chooser dialog "What would you like to do?" | Founder Row 4 + D4 | **Wired** | `RoutineDuplicateChooserDialog` with founder's exact subtitles |
| Single duplicate entry point | Convention #255 | **Wired** | Studio onDuplicate opens chooser, not parallel buttons |
| "Copy and Customize" deep-clone-only flow | Founder Row 4 | **Wired** | `RoutineDuplicateTemplateDialog` — name input, no target picker |
| "Assign Additional Member" existing flow preserved | Founder Row 4 | **Wired** | `RoutineDuplicateDialog` refactored to use shared `cloneRoutineTemplate` utility |
| `cloneRoutineTemplate` shared primitive | Founder D6 Thread 1 | **Wired** | `src/lib/templates/cloneRoutineTemplate.ts` |
| Deep-clone independence (mutations don't affect source) | Implicit | **Wired** | Vitest asserts new section IDs ≠ source section IDs |
| `linkedStepResolutions` honored on duplicate-and-deploy | Founder Row 4 | **Wired** | Existing per-step picker still works; resolutions threaded through to `cloneRoutineTemplate` |
| "Scheduled to start" badge on Studio My Customized | Founder Row 5 | **Wired** | `ScheduledStartBadge` size=full next to type pill |
| "Scheduled to start" badge on Tasks page | Founder Row 5 | **Wired** | `ScheduledStartBadge` size=compact below task title in TaskCard |
| Theme tokens only (no hardcoded colors) | Convention #15 | **Wired** | `color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)` everywhere |
| Post-save toasts on every save path | Founder Row 6 | **Wired** | `useRoutingToast` reused; 5 distinct toast variants |
| Anti-panic copy ("Saved — updated N active routines") | Founder Row 6 | **Wired** | Distinct names + count in handleEditConfirm toast |
| Overlap rule: non-overlapping date ranges allowed | Founder D5 | **Wired** | Migration 100176 trigger + `detectRoutineOverlap` utility |
| Trigger backstop on Postgres | Founder D5 | **Wired** | `prevent_overlapping_routine_assignments()` raises on overlap |
| Application-layer pre-check | Founder D5 | **Wired** | `detectRoutineOverlap` matches trigger math exactly |
| Overlap modal "Replace the existing one" option | Founder D5 | **Wired** | `RoutineOverlapResolutionModal` — archives old, deploys new |
| Overlap modal "Keep both, adjust dates" option | Founder D5 | **Wired** | Closes modal, leaves TaskCreationModal open for edit |
| Overlap modal "Cancel — let me think about it" option | Founder D5 | **Wired** | Closes modal, no save |
| "Open existing routine" deep link | Founder D5 refinement | **Wired** | Modal exposes `onOpenExistingRoutine` callback w/ existingTaskId |
| Lists parity audit | Founder Row 7 + D6 Thread 2 | **Stubbed** | Worksheet row 205 NEW-ZZ + `Lists-Template-Deploy-Decisions-Needed.md` |
| Shared utilities under `src/lib/templates/` | Founder D6 Thread 1 | **Wired** | `cloneRoutineTemplate`, `detectRoutineOverlap`, `getActiveTemplateDeployments` |
| Shared components under `src/components/templates/` | Founder D6 Thread 1 | **Wired** | `ScheduledStartBadge`, `MasterTemplateEditConfirmationModal`, `RoutineOverlapResolutionModal`, `RoutineDuplicateChooserDialog`, `RoutineDuplicateTemplateDialog` |
| `Shared-Assignment-Model-Worker-Handoff.md` dispatch doc | Founder D6 Thread 3 | **Wired** | Authored in c8 |
| `Lists-Template-Deploy-Decisions-Needed.md` dispatch doc | Founder D6 Thread 2 | **Wired** | Authored in c7 |
| Phase 2 audit: is_shared=true routines work with new gating + overlap | Worker 1 audit ask for Worker 2 | **Wired** | c1 vitest covers is_shared advance-start; overlap rule applies via template_id+assignee_id keys regardless of is_shared |
| Naming requirement: NO "kid"/"child" anywhere | Founder requirement | **Wired** | Audited every new component, modal, toast string |
| New convention: master-template propagation contract | c8 ask | **Wired** | Added as Convention #259 in CLAUDE.md |
| WIRING_STATUS.md updated | Convention #14 | **Wired** | Routine deployment rows added |
| FIX_NOW_SEQUENCE.md updated | Convention #14 | **Wired** | Version bump + changelog entry |
| `feature-decisions/README.md` updated | Convention #14 | **Wired** | This file added to index |
| `claude/live_schema.md` regenerated | Convention #14 | **Not required** | No schema column added (only trigger + index relax) |
| Convention #121 (tsc -b clean before commit) | Mandatory | **Wired** | Verified before every commit |
| Convention #257 (no client-side todayLocalIso writes) | Mandatory | **Wired** | All dtstart writes route through fetchFamilyToday RPC |

**Status key:** Wired = built and functional · Stubbed = in `Lists-Template-Deploy-Decisions-Needed.md` / `Shared-Assignment-Model-Worker-Handoff.md` (the worker's deferred-scope docs replace STUB_REGISTRY for these specific items, since they have full handoff packages) · Missing = incomplete

### Summary
- Total requirements verified: **38**
- Wired: **37**
- Stubbed: **1** (Lists parity, fully documented for Worker 4 dispatch)
- Missing: **0**

### Cumulative test coverage
- 64/64 vitest pass across:
  - `tests/recurring-task-filter-advance-start.test.ts` (12)
  - `tests/build-task-schedule-fields-routine.test.ts` (7)
  - `tests/detect-routine-overlap.test.ts` (15)
  - `tests/active-template-deployments.test.ts` (15)
  - `tests/clone-routine-template.test.ts` (7)
  - `tests/scheduled-start-badge.test.tsx` (8)

### Known gaps / follow-ups
- **Visual verification** of the new modals + badge in DevTools mobile viewport (375px) per `claude/PRE_BUILD_PROCESS.md` Visual Verification Standard. Worker did not run dev server; founder eyes-on confirmation gates the final Wired status on the visual surfaces.
- **Production migration apply** for migration 100176. Worker authored the migration; founder applies on next deploy cycle. The application code is forward-compatible — `detectRoutineOverlap` works regardless of trigger state.

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] Visual verification on the new modals + badge complete (DevTools 375px)
- [ ] Migration 100176 applied to production
- [ ] **Phase approved as complete**
- **Completion date:**

---

## Commit log

| Commit | Subject |
|---|---|
| `54e83b7` | feat(routines): advance-start gating in recurringTaskFilter (c1) |
| `09eb94b` | feat(routines): "Schedule to start later" toggle + dtstart persistence (c2) |
| `2e5c68b` | feat(routines): overlap detection — relax unique index + trigger backstop + warm modal (c2.5) |
| `2b19205` | feat(routines): master-template edit confirmation modal (c3) |
| `8f14578` | feat(studio): duplicate-template chooser + Copy and Customize flow (c4) |
| `8698afd` | feat(routines): "Scheduled to start" badge on Studio + Tasks (c5) |
| `9947eb5` | feat(routines): post-save toasts across all template save paths (c6) |
| `8a94687` | docs(lists): defer list-template propagation to a separate worker (c7) |
| `c8` | docs: feature decision file + dispatch + convention + WIRING_STATUS + FIX_NOW_SEQUENCE (this commit) |
