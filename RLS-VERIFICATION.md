# RLS Verification Matrix

Per-table, per-role access verification. Run after each build phase.

**Access Level Shorthand:**
- **All** — Unrestricted within family (mom only)
- **Full** — CRUD on own/family data
- **Read** — Read-only access
- **Scoped** — Access filtered by permissions (member_permissions, access_schedules)
- **None** — No access

| Table | Mom | Dad/Adult | Special Adult | Independent Teen | Guided/Play | RLS Policy Name | Verified | Notes |
|-------|-----|-----------|---------------|-----------------|-------------|-----------------|----------|-------|
| families | All | Read | Read | Read | Read | | | |
| family_members | All | Scoped | Scoped | Read own | Read own | | | |
| event_categories | All CRUD (custom) | Read | Read | Read | Read | event_categories_select, _insert/update/delete_primary_parent | 2026-03-28 | System cats (family_id IS NULL) readable by all incl. anon (W-1). is_system guard prevents modifying seeds. |
| calendar_events | All | Full Own + view family | Full Own + view family | Full Own (pending) + view approved | Read approved only | calendar_events_select/insert/update/delete | 2026-03-28 | W-2: pending_approval visible to Guided/Play (should restrict). W-3: INSERT doesn't enforce status for non-mom. |
| event_attendees | All | Read family events | Read family events | Read family events | Read family events | event_attendees_select/insert/update/delete | 2026-03-28 | E-1: SELECT doesn't mirror calendar_events visibility. Non-mom can see attendees for events they can't see. |
| calendar_settings | All CRUD | Read | Read | Read | Read | calendar_settings_select/insert/update | 2026-03-28 | OK. No DELETE policy (blocked by default). UNIQUE(family_id). |
| rhythm_configs | All family CRUD | Own CRUD | None | Own CRUD | Own CRUD | rhythm_configs_manage_own, rhythm_configs_parent_manage_all | 2026-04-07 | PRD-18 Phase A. Mom reads/writes ALL family configs via parent_manage_all. Other members only own. |
| rhythm_completions | Read all + write own | Own CRUD | None | Own CRUD | Own CRUD | rhythm_completions_manage_own, rhythm_completions_read_parent | 2026-04-07 | PRD-18 Phase A. Mom can SELECT all family completions for Family Overview indicators. Members manage own. Dad CANNOT read mom's completions (privacy). |
| feature_discovery_dismissals | Own CRUD | Own CRUD | None | Own CRUD | Own CRUD | fdd_manage_own | 2026-04-07 | PRD-18 Phase A. Per-member dismissal tracking. No cross-member access. Verified Dad cannot read mom's dismissals. |
| morning_insight_questions | Read all + family-custom CRUD | Read | Read | Read | Read | miq_read_all, miq_manage_family | 2026-04-07 | PRD-18 Phase A. Empty in Phase A (Phase C seeds 35 questions). Read open to all authenticated. Family-level custom questions writable by primary_parent only. |
| archive_context_items | All (full CRUD + filtered rows) | Read family non-filtered only | Read family non-filtered only | Read family non-filtered only | Read family non-filtered only | aci_select_own_family, aci_manage_primary_parent, archive_context_items_privacy_filter_role_asymmetric | 2026-04-17 (inspection) | PRD-13 + Convention #76 + RECON Decision 7. New RESTRICTIVE policy (S3.4) enforces role-asymmetric `is_privacy_filtered`: mom sees all rows, non-mom roles see only `is_privacy_filtered=false`. Reuses `public.is_primary_parent_of(family_id)` helper from migration 100100. Behavioral verification deferred — production has zero `is_privacy_filtered=true` rows at push time (see S3 entry below). |
| | | | | | | | | |

---

## PRD-18 Phase A RLS Verification (2026-04-07)

Migration `00000000100103_rhythms_foundation.sql` adds 4 new tables. Verified via 17 RLS tests against the founder family (`OurFamily`, 9 members) using `npx supabase db query` with `SET LOCAL ROLE authenticated` + JWT claim impersonation.

### Test Users
- **Mom (Tenise):** `7434224b-ebb4-4138-8bd8-9fbc62259c42` — primary_parent
- **Dad (Jerrod):** `44a07ad8-94ca-4dd4-84d8-42ae103cf1a6` — additional_adult
- **Guided kid (Mosiah):** `bfa887d0-a3ad-4c62-bdc7-6eda7dcc25c4` — member, dashboard_mode='guided'

### Test Results

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1  | Mom reads ALL family rhythm_configs | 29 (full family) | 29 | PASS |
| 2  | Mom reads Dad's rhythm_configs | 5 | 5 | PASS |
| 3  | Dad reads OWN rhythm_configs | 5 | 5 | PASS |
| 4  | Dad reads Mom's rhythm_configs | 0 (privacy) | 0 | PASS |
| 5  | Guided kid reads OWN rhythm_configs | 1 (morning only) | 1 | PASS |
| 6  | Guided kid reads Mom's rhythm_configs | 0 (privacy) | 0 | PASS |
| 7  | Mom reads ALL family rhythm_completions | 0 (none yet) | 0 | PASS |
| 8  | Dad reads Mom's rhythm_completions | 0 (privacy) | 0 | PASS |
| 9  | Mom reads morning_insight_questions | 0 (empty Phase A) | 0 | PASS |
| 10 | Dad reads morning_insight_questions | 0 | 0 | PASS |
| 11 | Guided kid reads morning_insight_questions | 0 | 0 | PASS |
| 12 | Mom reads OWN feature_discovery_dismissals | 0 | 0 | PASS |
| 13 | Dad reads Mom's feature_discovery_dismissals | 0 (privacy) | 0 | PASS |
| 14 | Anonymous reads rhythm_configs | 0 (RLS denies) | 0 | PASS |
| 15 | Anonymous reads rhythm_completions | 0 (RLS denies) | 0 | PASS |
| 16 | Mom UPDATE her own rhythm_config | 1 affected | 1 | PASS |
| 17 | Dad UPDATE Mom's rhythm_config | 0 affected (privacy) | 0 | PASS |

### Critical Privacy Findings

- **Mom's parent_manage_all policy works correctly** — she successfully reads and updates configs for all family members, which the Family Overview will need (Phase B wires the indicator query).
- **Dad to Mom privacy boundary is enforced.** Dad cannot read or write Mom's rhythm_configs / rhythm_completions / feature_discovery_dismissals. Attempts return 0 rows or 0 affected without error (silent RLS filtering).
- **Guided kids only see their own data.** Mosiah can read his single morning rhythm config but nothing from Mom or anyone else.
- **Anonymous access is fully denied** on the two private tables (rhythm_configs, rhythm_completions). morning_insight_questions has `miq_read_all` which intentionally allows authenticated users to read system defaults (family_id IS NULL) — anon access not tested but not part of the required matrix.

### Special Adult Coverage

Special Adult role was NOT directly tested because OurFamily has no active special_adult member. The RLS policies for the 4 new tables use `auth.uid()` IN `family_members WHERE user_id = auth.uid()` and `role = 'primary_parent'` — Special Adults will fall through both filters and get 0 rows, matching the PRD-18 requirement that "rhythms are outside Special Adult scope" (PRD-18 line 622). Phase B should add a special_adult test member for direct verification.


---

## Calendar RLS Issues (2026-03-28)

| ID | Severity | Table | Description | Fix |
|----|----------|-------|-------------|-----|
| W-1 | Warning | event_categories | System categories (family_id IS NULL) readable by unauthenticated users | Likely intentional per PRD ("public read"). Confirm with founder. |
| W-2 | Warning | calendar_events | pending_approval events visible to ALL roles including Guided/Play children | Change SELECT arm 1 from `IN ('approved','pending_approval')` to `= 'approved'` |
| W-3 | Warning | calendar_events | INSERT policy doesn't enforce `status = 'pending_approval'` for non-primary-parent | Add CHECK constraint or policy condition on status column |
| E-1 | Error | event_attendees | SELECT bypasses calendar_events visibility rules — non-mom can see attendees for rejected/cancelled events | Mirror the calendar_events visibility logic in attendee SELECT policy |


---

## Archive Privacy Filter Defense-in-Depth RLS Verification (Phase 0.26 Session 3)

Migration `00000000100149_archive_context_items_privacy_rls.sql` adds a RESTRICTIVE SELECT policy on `archive_context_items` enforcing role-asymmetric `is_privacy_filtered` semantics at the database layer. Defense-in-depth on top of Edge Function filtering applied in commits `6760ad1`, `7fe5ffa`, `7cd034e`.

### Test Users

Same as PRD-18 Phase A verification (OurFamily, founder family):
- **Mom (Tenise):** `7434224b-ebb4-4138-8bd8-9fbc62259c42` — primary_parent
- **Dad (Jerrod):** `44a07ad8-94ca-4dd4-84d8-42ae103cf1a6` — additional_adult
- **Guided kid (Mosiah):** `bfa887d0-a3ad-4c62-bdc7-6eda7dcc25c4` — member, dashboard_mode='guided'

Note: OurFamily has no independent teen at the time of this verification. Mosiah's tests serve as the non-mom proxy. The role-asymmetric policy only checks `role = 'primary_parent'`, so all non-primary roles (additional_adult, special_adult, independent, guided, play) behave identically under this policy.

### Test Cases (reproducible SQL)

Each test runs against `archive_context_items`. Setup assumes at least one row in OurFamily with `is_privacy_filtered = true` and at least one with `is_privacy_filtered = false`. Run via `npx supabase db query` with JWT claim impersonation (matches PRD-18 Phase A pattern).

#### Test 1: Mom sees both filtered and unfiltered rows
```sql
SET LOCAL request.jwt.claims TO '{"sub":"7434224b-ebb4-4138-8bd8-9fbc62259c42","role":"authenticated"}';
SET LOCAL ROLE authenticated;
SELECT
  COUNT(*) FILTER (WHERE is_privacy_filtered = true)  AS filtered_visible,
  COUNT(*) FILTER (WHERE is_privacy_filtered = false) AS unfiltered_visible
FROM public.archive_context_items;
-- Expected: filtered_visible > 0, unfiltered_visible > 0
```

#### Test 2: Dad sees only unfiltered rows
```sql
SET LOCAL request.jwt.claims TO '{"sub":"44a07ad8-94ca-4dd4-84d8-42ae103cf1a6","role":"authenticated"}';
SET LOCAL ROLE authenticated;
SELECT
  COUNT(*) FILTER (WHERE is_privacy_filtered = true)  AS filtered_visible,
  COUNT(*) FILTER (WHERE is_privacy_filtered = false) AS unfiltered_visible
FROM public.archive_context_items;
-- Expected: filtered_visible = 0, unfiltered_visible > 0
```

#### Test 3: Non-mom member (teen / guided / additional adult / etc.) sees only unfiltered rows
```sql
SET LOCAL request.jwt.claims TO '{"sub":"bfa887d0-a3ad-4c62-bdc7-6eda7dcc25c4","role":"authenticated"}';
SET LOCAL ROLE authenticated;
SELECT
  COUNT(*) FILTER (WHERE is_privacy_filtered = true)  AS filtered_visible,
  COUNT(*) FILTER (WHERE is_privacy_filtered = false) AS unfiltered_visible
FROM public.archive_context_items;
-- Expected: filtered_visible = 0, unfiltered_visible > 0
```

### Test Results — 2026-04-17

Migration `00000000100149_archive_context_items_privacy_rls.sql` applied to production (project ref `vjfbzpliqialqmabfnxs`) on 2026-04-17. Push output: clean apply, no errors, policy live on `archive_context_items`.

| # | Test | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1 | Mom sees filtered + unfiltered | both > 0 | Deferred — no test data | Deferred |
| 2 | Dad sees unfiltered only | filtered=0, unfiltered>0 | Deferred — no test data | Deferred |
| 3 | Non-mom member sees unfiltered only | filtered=0, unfiltered>0 | Deferred — no test data | Deferred |

**Verification deferred.** Production `archive_context_items` had zero `is_privacy_filtered=true` rows at push time (170 total rows, all unfiltered). The Mom's Observations feature (`InnerWorkings.tsx:1103-1120` — sole writer of `is_privacy_filtered=true`) is built but unused in production. Role-asymmetric behavior is asserted by policy inspection (RESTRICTIVE + reuse of vetted `is_primary_parent_of()` helper from migration `00000000100100_prd15_fix_rls_recursion.sql`) rather than behavioral test. Running identical-result queries across mom/dad/non-mom proxy against a dataset with no filtered rows would produce false confidence, not signal — so the queries were not executed. Verification will re-run when the first privacy-filtered row exists in production, or when Testworth family is seeded with test data for synthetic verification (future session).

**Policy correctness asserted by inspection:**
- RESTRICTIVE clause correctly AND's with existing PERMISSIVE policies (rather than creating a silent no-op, which PERMISSIVE would have done).
- `USING (is_privacy_filtered = false OR public.is_primary_parent_of(family_id))` — mom passes the second arm, non-mom roles only pass the first arm.
- Helper function `is_primary_parent_of(p_family_id UUID)` is STABLE, SECURITY DEFINER, `search_path` locked — vetted and reused from migration 100100.
- SELECT-only scope — writes untouched, no CRUD lockouts introduced.

**Pre-push audit of app-layer consumers** (38 `archive_context_items` references across `src/` and `supabase/functions/`): 4 fixed in S3.1-S3.3 (Edge Function sites wrapped with `applyPrivacyFilter`), 11 writes (unaffected by SELECT RLS), 1 pre-existing frontend read with correct conditional filter (`src/lib/ai/context-assembly.ts:218-228`), 12 reads without filter (now tightened invisibly by RLS — all are either mom-only features, non-mom accessing their own data where filtering is intended, or cosmetic count queries), 10 non-query references. Zero legitimate use cases require non-mom access to filtered rows. Defense-in-depth acts as belt-and-suspenders for the 12 unfiltered frontend reads.


---

## tasks + task_assignments recursion fix (2026-04-22)

Migration `00000000100151_rls_tasks_task_assignments_recursion_fix.sql` replaces the `ta_via_task` policy on `public.task_assignments` — which caused `ERROR: infinite recursion detected in policy for relation "tasks"` on any UPDATE against `tasks` that tripped both sibling policies — with a non-recursive `ta_via_family` policy. Introduces `public.auth_family_ids()` SECURITY DEFINER helper (mirrors existing `get_my_family_id()` but returns SETOF).

Root cause: `tasks.tasks_update_assigned_member` subquery on `task_assignments` triggered `ta_via_task` which subqueried `tasks`, which re-triggered `tasks_update_assigned_member`, and Postgres aborted. User impact: "Remove from dashboard" menu item silently failed; server-side archives failed; Playwright cleanup hit the same error.

Fix: `ta_via_family` checks `member_id`/`family_member_id` against `family_members` + `auth_family_ids()` — never references `tasks`. Cycle broken.

### Test Results — 2026-04-22

| # | Role | Operation | Target | Expected | Actual | Result |
|---|------|-----------|--------|----------|--------|--------|
| 1 | Mom | UPDATE archived_at | Task assigned to Helam | Succeeds (primary_parent) | was_updated=true | PASS |
| 2 | Mom | UPDATE archived_at | Own Morning Routine | Succeeds | was_updated=true | PASS |
| 3 | Mom | SELECT tasks | Own family | 53 rows | 53 | PASS |
| 4 | Mom | SELECT task_assignments | Own family | 27 rows | 27 | PASS |
| 5 | Mom | SELECT task_assignments | Other family | 0 rows | 0 | PASS |
| 6 | Dad | UPDATE archived_at | Task assigned to Helam | Blocked | was_updated=false | PASS |
| 7 | Dad | SELECT tasks | Own family | 53 rows | 53 | PASS |
| 8 | Dad | SELECT task_assignments | Own family | 27 rows | 27 | PASS |
| 9 | Independent (Miriam) | UPDATE archived_at | Own task | Succeeds | was_updated=true | PASS |
| 10 | Independent (Miriam) | UPDATE archived_at | Helam's task | Blocked | was_updated=false | PASS |
| 11 | Independent | SELECT tasks | Own family | 53 rows | 53 | PASS |
| 12 | Independent | SELECT task_assignments | Own | 2 rows | 2 | PASS |
| 13 | Guided (Mosiah) | UPDATE archived_at | Own task | Succeeds | was_updated=true | PASS |
| 14 | Guided | UPDATE archived_at | Helam's task | Blocked | was_updated=false | PASS |
| 15 | Guided | SELECT tasks | Own family | 53 rows | 53 | PASS |
| 16 | Guided | SELECT task_assignments | Own | 7 rows | 7 | PASS |
| 17 | Special Adult (Amy) | SELECT tasks | Own family | 23 rows | 23 | PASS |
| 18 | Special Adult | UPDATE archived_at | Sarah's task | Blocked | was_updated=false | PASS |
| 19 | Special Adult | SELECT task_assignments | Own family | 0 rows | 0 | PASS |
| 20 | Mom | UPDATE tasks | Another family | 0 rows | 0 | PASS |
| 21 | Mom | SELECT tasks | Another family | 0 rows | 0 | PASS |
| 22 | Mom | INSERT task_assignment | Own family | Succeeds | 1 row | PASS |
| 23 | Guided (Mosiah) | INSERT task_assignment | Own family | Succeeds (W-4) | inserted | NOTE |
| 24 | Sarah (other family) | INSERT task_assignment | OurFamily | 42501 RLS error | error 42501 | PASS |
| 25 | Mom | DELETE task_assignment | Own family | Succeeds | gone | PASS |
| 26 | Independent (Miriam) | DELETE task_assignment | Helam's assignment | Succeeds (W-4) | gone | NOTE |
| 27 | Helam | UPDATE archived_at | Own Kitchen Zone | Succeeds | was_updated=true | PASS |
| 28 | Independent (Miriam) | UPDATE | Mom's Morning Routine | Blocked | was_updated=false | PASS |
| 29 | Anonymous | SELECT tasks | Any | 0 rows | 0 | PASS |

**Verification:** All 29 tests behaved as expected. Canonical failing path (`UPDATE tasks SET archived_at = NOW()` as any role with assignee/primary_parent access) now succeeds without recursion error. Confirmed end-to-end by re-running `tests/e2e/features/routine-assign-mosiah-repro.spec.ts` — cleanup via supabase-js archive call now succeeds where it previously blew up.

### W-4 — inherited behavior (not a regression from 100151)

`ta_via_family` grants `FOR ALL` family-wide access on `task_assignments`, which means non-admin members can technically INSERT (T23) and DELETE (T26) rows on this join table. This is preserved exactly from the pre-existing `ta_via_task` policy in migration 000008 — 100151 changed only *how* the family scope is computed, not *who* can write. The meaningful gate lives on `tasks` itself, where children cannot UPDATE tasks they don't own (T10/T14/T28 all PASS). Founder-level decision for a follow-up pass: if non-admin members should be prevented from manipulating assignment rows independently, split `ta_via_family` into separate SELECT/INSERT/DELETE policies with admin-only writes.
