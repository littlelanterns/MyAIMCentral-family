# Lists — Template Deploy Decisions Needed

> **Filed:** 2026-04-25 by Worker ROUTINE-PROPAGATION (founder D6 Thread 2)
> **Status:** Awaiting founder decisions before a Lists-focused worker can dispatch
> **Cross-ref:** TRIAGE_WORKSHEET.md row 205 NEW-ZZ
> **Worker handoff pre-reqs:** see `Shared-Assignment-Model-Worker-Handoff.md` for the assignment-model side; this doc is the **template-deploy** side.

---

## Why this document exists

Worker ROUTINE-PROPAGATION (2026-04-25) shipped advance-start gating, master-template edit confirmation, duplicate-and-rename, the scheduled-start badge, and post-save toasts for the **routine** side. Lists were intentionally out of scope per founder D6 Thread 2 because the Phase 1 audit surfaced a deeper gap: **list templates have no deployment wiring at all**.

Building list-template deploy is non-trivial — it's not a small parity fix on top of working plumbing, it's the first time the plumbing has to exist. That made it a poor fit for bundling into this worker's session. The fix belongs to a separate Lists-focused worker.

This document captures everything that worker needs from founder before they can dispatch.

---

## Current state of `list_templates`

### Schema (per `claude/live_schema.md`)

`list_templates` (12 rows, all system seeds):

| # | Column |
|---|---|
| 1 | `id` |
| 2 | `title` |
| 3 | `description` |
| 4 | `list_type` |
| 5 | `default_items` (JSONB array) |
| 6 | `is_system` |
| 7 | `created_at` |
| 8 | `family_id` |
| 9 | `created_by` |
| 10 | `template_name` |
| 11 | `usage_count` |
| 12 | `last_deployed_at` |
| 13 | `archived_at` |
| 14 | `updated_at` |
| 15 | `is_system_template` |
| 16 | `is_example` |
| 17 | `example_use_cases` |
| 18 | `category_label` |

`lists` (the deploy target — 42 rows in production):

- Has `template_id` UUID column, **never written**
- Has `is_shared` column (PRD-09B Convention #149)
- All other deployment-side fields exist but the deploy flow doesn't populate them from a template

### Code wiring

`list_templates` is referenced in **only 2 places** in `src/`:

1. [src/hooks/useLists.ts:389](src/hooks/useLists.ts#L389) — `useListTemplates()` SELECT for browse display
2. [src/hooks/useLists.ts:431](src/hooks/useLists.ts#L431) — `useSaveListAsTemplate()` writes a template from an existing list (the user can convert a list they built into a reusable template, but can't go the other way)

Studio's [Customize] action for list types ([src/pages/Studio.tsx:413](src/pages/Studio.tsx#L413)) navigates to `/lists?create=<list_type>`. The Lists page parses the URL param and opens a **blank** list creation modal of that type. `default_items` from the template are **never read**.

### Net effect

The 12 system list_templates rows are decorative shelf items. Mom can browse them in Studio but cannot actually use one as a starting point for a new list. The `lists.template_id` column has been waiting for someone to write to it.

---

## Decisions needed from founder

A Lists-focused worker cannot ship until founder weighs in on each of these. Each has a small bias from this worker (informed by what the routine side learned), but every one is overridable.

### D-L1 — Hydration model: snapshot vs live binding?

When mom deploys a list from a template, do `default_items` hydrate into `list_items` as a **snapshot** (template is decorative after that, edits to the master don't propagate), or as a **live binding** (the deployed list reads items live from the template, and master edits propagate)?

- **Routines chose live binding** for sections + steps. Master edits propagate to all active deployments via `template_id` join in `useRoutineTemplateSteps`. The propagation contract is documented as a CLAUDE.md convention (added by Worker 1 c8).
- **Lists are different.** A "Weekly Grocery List" template that snapshots items at deploy time matches the natural mental model: mom hits [Customize] on Weekly Grocery, lands on her own list, immediately starts checking things off. Live binding would mean every time the system template is updated, every deployed weekly list rewinds the items mom may have added/removed.

**Worker recommendation:** snapshot at deploy time for `default_items`. If founder later wants live propagation for some list types (e.g. shared family shopping list), that's a per-list-type opt-in.

### D-L2 — What counts as an "active list deployment" for propagation count?

If founder picks live binding (D-L1), the master-edit confirmation modal needs to count "how many deployed lists is this template attached to?" Same modal copy as routines — but the count needs a SQL query.

- Routines count: `tasks` rows where `template_id = X AND archived_at IS NULL AND status NOT IN ('completed','cancelled')`.
- Lists candidate: `lists` rows where `template_id = X AND archived_at IS NULL`.
- But shopping lists "complete" by all items checked off — does that count as inactive? Founder needs to define the active-deployment predicate per list_type.

**Worker recommendation:** if D-L1 = snapshot, this question doesn't apply. If D-L1 = live binding, the predicate is `archived_at IS NULL` only — even fully-checked lists keep the binding alive in case mom adds new items.

### D-L3 — Should list-template edits propagate to deployed lists at all?

This is the meta-question that D-L1 + D-L2 reduce to. For routines, founder's clear answer was "yes, master edits propagate." For lists, the answer might be "no, the template is just a starting point." Confirming this up front prevents the Lists worker from building propagation infrastructure mom doesn't want.

**Worker recommendation:** ship without propagation in v1. Add propagation later as a per-list-type opt-in if a real use case surfaces.

### D-L4 — How does duplicate-and-rename apply to lists?

Routines got a chooser dialog ("Copy and Customize" vs "Assign Additional Member") because the deep-clone preserves a 60-step routine without mom retyping. Lists are simpler — `default_items` is one JSONB array. Does the same chooser UI apply, or do lists just need a single "Duplicate" button that opens a name input?

**Worker recommendation:** single "Duplicate" button → name input → save. No chooser, no deep-clone-vs-assign distinction. List items are just data; the deep clone is one query. Reuse the `RoutineDuplicateTemplateDialog` shape (already under `src/components/templates/`) renamed for lists.

### D-L5 — How does advance scheduling apply to one-time lists like packing?

Routines got "Schedule to start later" because they're recurring. Lists like packing or a one-shot shopping run aren't. Does mom need an advance-start picker on lists at all?

- Some lists ARE recurring-feeling (weekly grocery, daily check-list). Mom may want to schedule next week's grocery list to "appear" Monday morning.
- Other lists are one-shot.

**Worker recommendation:** ship lists without advance scheduling in v1. If founder wants it later, the `ScheduledStartBadge` component is already shared under `src/components/templates/` and consumes a `dtstart` prop — so wiring it to a future `lists.scheduled_start_date` column is one import.

### D-L6 — Does the master-edit confirmation modal apply to lists?

`MasterTemplateEditConfirmationModal` is generic (count + names + reassurance text). If lists support live binding (D-L1 + D-L3 = yes), the same modal can fire for list-template edits. The Lists worker just needs an analog of `getActiveTemplateDeployments` that queries `lists` instead of `tasks`.

**Worker recommendation:** if D-L1 = snapshot, modal doesn't apply. If D-L1 = live binding, reuse the modal directly — it's already audience-neutral.

---

## Shared utilities now available for Lists worker

These landed under `src/lib/templates/` and `src/components/templates/` per founder D6 Thread 1 and are designed for cross-feature reuse. The Lists worker should consume them rather than re-implement.

### src/lib/templates/

- `cloneRoutineTemplate(supabase, input)` — pure deep-clone primitive. Lists won't reuse this directly (different table shapes), but it's the **shape** to mirror: `cloneListTemplate(supabase, { sourceTemplateId, newTitle, familyId, createdBy, defaultItems })` would be ~30 lines.
- `detectRoutineOverlap(supabase, input)` — overlap math + display name resolution. Almost certainly N/A for lists (lists don't have date ranges in v1).
- `getActiveTemplateDeployments(supabase, templateId)` — count active deployments + resolve assignee names. Reusable directly if the Lists worker adds a generic `tableName` param. Or fork into `getActiveListDeployments`.
- `getActiveTemplateDeployments` exports `distinctAssigneeNames` and `formatNameList` helpers — these ARE reusable verbatim for any modal copy that needs Oxford-comma name lists.

### src/components/templates/

- `ScheduledStartBadge` — pure presentational, returns null when dtstart is past/today. Reusable verbatim once Lists has a `dtstart` to feed it.
- `MasterTemplateEditConfirmationModal` — audience-neutral. Reusable verbatim for list templates if D-L3 says yes.
- `RoutineOverlapResolutionModal` — routine-specific copy ("which days?"). Lists worker would build a list-specific equivalent if needed.
- `RoutineDuplicateChooserDialog` — routine-specific (chooses between "Copy and Customize" vs "Assign Additional Member"). Lists may not need a chooser at all (D-L4).
- `RoutineDuplicateTemplateDialog` — name-input-only dialog. **Most directly reusable for lists** — fork into `ListDuplicateTemplateDialog` with one swap from `cloneRoutineTemplate` to `cloneListTemplate`.

---

## Recommended dispatch sequence

1. **Now (Worker 1 ROUTINE-PROPAGATION):** lands shared utilities + dispatch docs (this file + `Shared-Assignment-Model-Worker-Handoff.md`).
2. **Next (Worker 2 SHARED-ROUTINES):** ships shared routines per founder D6 Thread 3. Reuses Worker 1 shared utilities, builds shared-completion + completer-color-rendering on top.
3. **Then (Worker 3 SHARED-LISTS):** ships shared lists, parallel of Worker 2 work.
4. **Finally (Worker 4 LISTS-TEMPLATE-DEPLOY):** ships the gap this doc describes. By then, founder has seen shared lists in production and has lived experience to answer D-L1 through D-L6 with confidence. The shared utilities are already proven.

This sequence is a recommendation, not a constraint. If founder wants Lists template deploy sooner, dispatch Worker 4 directly after answering the 6 decisions above.

---

## Pre-reqs for Worker 4 dispatch

- Founder has answered D-L1 through D-L6.
- Worker 4's pre-build summary cites this doc + lists which D-L decisions it's relying on.
- Worker 4 reads the shared utilities under `src/lib/templates/` and `src/components/templates/` and either reuses them or articulates exactly why a fork is needed.
- If D-L3 = yes (propagation): Worker 4 adds a CLAUDE.md convention mirroring Worker 1's "Master template edits propagate live..." convention but for lists.

---

## Founder action requested

Please answer D-L1 through D-L6 when convenient. No urgency — Worker 4 isn't dispatched yet, and the answers will benefit from seeing Workers 2 and 3 ship first.
