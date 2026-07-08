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
| point_transactions | All (family-wide read only) | Read own | Read own | Read own | Read own | pt_select (SELECT only — no INSERT/UPDATE/DELETE policy exists for any role) | 2026-07-07 (live behavioral test) | PRD-24 Point Economy Addendum §8.1, Convention #223 append-only ledger (3rd sibling after `financial_transactions`/`family_goal_contributions`). Migration `00000000100295`. All writes route exclusively through `record_point_transaction()` SECURITY DEFINER (EXECUTE revoked from anon/authenticated, granted to service_role only) — direct client INSERT/UPDATE/DELETE and direct RPC invocation are all blocked at the DB layer, confirmed live. `grant_points()` (unchanged external contract, still EXECUTE-granted to authenticated) internally calls `record_point_transaction()` and this internal call succeeds despite the REVOKE, since the DEFINER's privileges apply inside a SECURITY DEFINER function. Kid ledger visibility is intentional (PRD addendum: kid-visible ledger history) — teen/guided/play members can read their own rows. Full test detail below. |
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


---

## task_assignments split + routine uniqueness (2026-04-22)

Migration `00000000100152_routine_dedupe_and_task_assignments_split.sql`. Two independent hardening passes: (A) partial unique index on `tasks` preventing duplicate active routine assignments per (template_id, assignee_id); (B) `ta_via_family` (the family-wide ALL policy from migration 100151) replaced with four per-command policies — ta_select / ta_insert / ta_update / ta_delete — closing W-4.

New helper: `public.auth_is_admin_of(p_family_id uuid)` — SECURITY DEFINER, STABLE, returns TRUE when the caller is `primary_parent` or `additional_adult` in that family. Used by ta_insert, ta_update, ta_delete.

### Test Roster
- **Mom (Tenise):** user_id `7434224b` / fm_id `fcac562b` — primary_parent
- **Dad (Jerrod):** user_id `44a07ad8` / fm_id `0aea47e9` — additional_adult
- **Independent teen (Helam):** user_id `75a9aa25` / fm_id `b266cf06` — member/independent
- **Independent teen (Miriam):** user_id `280fe726` / fm_id `3554dacd` — member/independent
- **Guided child (Mosiah):** user_id `bfa887d0` / fm_id `476f5e1f` — member/guided
- Special adult skipped — no active special_adult in OurFamily with a separate family_id context; deferred per founder direction (Special Adult dashboards not yet built).

### Part A — task_assignments 4-way policy split

#### Infrastructure verification

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Policy count on task_assignments | 4 | 4 | PASS |
| Policy names | ta_select, ta_insert, ta_update, ta_delete | ta_select, ta_insert, ta_update, ta_delete | PASS |
| auth_is_admin_of function exists | prosecdef=true | prosecdef=true (SECURITY DEFINER) | PASS |

#### SELECT — all family members read all family assignment rows

| # | Role | Expected | Actual | Result |
|---|------|----------|--------|--------|
| T1 | Mom | 28 rows | 28 | PASS |
| T2 | Dad | 28 rows | 28 | PASS |
| T3 | Helam (independent teen) | 28 rows | 28 | PASS |
| T4 | Mosiah (guided child) | 28 rows | 28 | PASS |

#### INSERT — admins can assign anyone; non-admins self-only

| # | Role | Operation | Expected | Actual | Result |
|---|------|-----------|----------|--------|--------|
| T6 | Mom | INSERT assignment for Miriam | Succeeds (admin) | id returned | PASS |
| T7 | Dad | INSERT assignment for Mosiah | Succeeds (admin) | id returned | PASS |
| T8 | Mosiah (guided) | INSERT self-assignment | Succeeds (self-add allowed) | id returned | PASS |
| T9 | Mosiah (guided) | INSERT sibling (Helam) assignment | 42501 RLS violation | `ERROR 42501: new row violates row-level security policy` | PASS — W-4 FIXED |
| T10 | Helam (independent teen) | INSERT self-assignment | Succeeds (self-add allowed) | id returned | PASS |
| T17 | Helam (independent teen) | INSERT sibling (Mosiah) assignment | 42501 RLS violation | `ERROR 42501: new row violates row-level security policy` | PASS — W-4 FIXED |

#### UPDATE — admins update anything; non-admins update own rows only

| # | Role | Operation | Expected | Actual | Result |
|---|------|-----------|----------|--------|--------|
| T14 | Mosiah (guided) | UPDATE own is_active | Succeeds (self-edit) | id + is_active=false returned | PASS |
| T15 | Helam (independent teen) | UPDATE Mosiah's assignment | 0 rows affected (silent RLS) | 0 rows | PASS |
| T16 | Dad | UPDATE Mosiah's assignment | Succeeds (admin) | id returned | PASS |

#### DELETE — admins only; no child removes any assignment row

| # | Role | Operation | Expected | Actual | Result |
|---|------|-----------|----------|--------|--------|
| T11 | Mom | DELETE Mosiah's assignment | Succeeds (admin) | id returned | PASS |
| T12 | Mosiah (guided) | DELETE own assignment | 0 rows affected (silent RLS) | 0 rows | PASS — DELETE blocked |
| T13 | Helam (independent teen) | DELETE Mosiah's assignment | 0 rows affected (silent RLS) | 0 rows | PASS — DELETE blocked |

Note on T12/T13: Postgres DELETE under RLS silently returns 0 rows rather than raising 42501 (unlike INSERT WITH CHECK which raises immediately). The row is not deleted — verified by confirming the assignment still exists after the transaction committed. Behavior is correct per Postgres RLS semantics.

### Part B — Partial unique index `tasks_unique_active_routine_per_assignee`

Index definition confirmed from `pg_indexes`:
```
CREATE UNIQUE INDEX tasks_unique_active_routine_per_assignee ON public.tasks
  USING btree (template_id, assignee_id)
  WHERE task_type = 'routine' AND archived_at IS NULL
    AND template_id IS NOT NULL AND assignee_id IS NOT NULL
```

Test pair: Herringbone template (`91d92dc8`) + Mosiah (`476f5e1f`). One active routine row already exists (`4f696d03`).

| # | Scenario | Expected | Actual | Result |
|---|----------|----------|--------|--------|
| T19 | Index exists in pg_indexes | Present | Present, correct WHERE clause | PASS |
| T20 | INSERT duplicate active routine (same template + assignee) | 23505 unique_violation | `ERROR 23505: duplicate key value violates unique constraint "tasks_unique_active_routine_per_assignee"` | PASS |
| T21 | Archive existing row, then INSERT same pair | Succeeds (archived exempt) | id returned | PASS |
| T22 | INSERT same template, different assignee (Miriam) | Succeeds (different key) | id returned | PASS |
| T23 | INSERT same assignee (Mosiah), different template (Kitchen Zone) | Succeeds (different key) | id returned | PASS |

All T19–T23 via BEGIN/ROLLBACK — no permanent data written. T20 transaction rolled back on error (no orphan row created).

### Summary

**W-4 fully closed.** Guided children and independent teens can no longer INSERT sibling assignments (42501) or DELETE any assignment row (0-row silent block). Admins retain full INSERT/UPDATE/DELETE. Self-INSERT and self-UPDATE remain available to non-admins. Partial unique index prevents duplicate active routine rows at the database layer regardless of code path — 23505 on duplicate, exempt for archived rows, different template, or different assignee.


---

## task_assignments — 2026-04-22 addendum: auth_is_admin_of() narrowed to primary_parent only

Migration `00000000100153` narrowed `public.auth_is_admin_of(p_family_id uuid)` to return TRUE only when the caller holds `role = 'primary_parent'` in that family. Previously the function also returned TRUE for `additional_adult`, which gave Dad (Jerrod, role=additional_adult) unrestricted INSERT/UPDATE/DELETE on `task_assignments` via the admin predicate in ta_insert / ta_update / ta_delete policies.

Per PRD-02: Dad's elevated access comes from `member_permissions` grants, NOT from his role. Dad is not automatically an admin of task assignment rows.

### Re-verification — Dad (Jerrod) and Mom (Tenise)

All tests run as BEGIN/ROLLBACK — no permanent data written.

- **Dad fm_id:** `0aea47e9-e6fa-4300-b4a7-6da097c26f9e`
- **Helam fm_id:** `b266cf06-d2b4-4c7b-a6bd-559224367005`
- **Helam assignment used for UPDATE/DELETE tests:** `afce593d` (Helam's row)
- **Dad's own assignment used for self-UPDATE test:** `03698fbf` (Dad's row)

| # | Role | Operation | Target | Expected | Actual | Result |
|---|------|-----------|--------|----------|--------|--------|
| R1 | Dad | SELECT task_assignments | Own family | Succeeds (ta_select unchanged) | 28 rows | PASS |
| R2 | Dad | INSERT assignment | Dad's own fm_id | Succeeds (non-admin self-add path) | id returned | PASS |
| R3 | Dad | INSERT assignment | Helam's fm_id | BLOCKED (admin predicate fails; non-admin predicate fails — not self) | 42501 RLS error | PASS |
| R4 | Dad | UPDATE assignment | Helam's row (`afce593d`) | BLOCKED (0 rows silent) | 0 rows | PASS |
| R5 | Dad | UPDATE assignment | Dad's own row (`03698fbf`) | Succeeds (non-admin self-update path) | id returned | PASS |
| R6 | Dad | DELETE assignment | Helam's row (`afce593d`) | BLOCKED (0 rows silent) | 0 rows | PASS |
| R7 | Mom | INSERT assignment | Helam's fm_id | Succeeds (primary_parent = admin) | id returned | PASS |
| R8 | Mom | UPDATE assignment | Helam's row (`afce593d`) | Succeeds (primary_parent = admin) | id returned | PASS |
| R9 | Mom | DELETE assignment | Helam's row (`afce593d`) | Succeeds (primary_parent = admin) | id returned | PASS |

**Result:** Helper narrowing behaves exactly as intended. Dad retains SELECT (read) and self-scoped INSERT/UPDATE but loses the admin INSERT-for-others, admin UPDATE, and admin DELETE paths. Mom's full admin access is unaffected. PRD-02 access model correctly enforced at the database layer.

---

## point_transactions — 2026-07-07 verification (migration 100295, PRD-24 Point Economy Addendum §8.1)

New append-only points ledger, third sibling after `financial_transactions` (Convention #223) and `family_goal_contributions` (migration 100284). All tests run live against the linked production database (project ref `vjfbzpliqialqmabfnxs`) via `supabase db query --linked` with JWT claim impersonation (`SET LOCAL request.jwt.claims` + `SET LOCAL ROLE authenticated`/`anon`), matching the established pattern in this file. All mutation probes wrapped in `BEGIN ... ROLLBACK` — zero permanent data written; residue check at the end confirms Testworth family still has exactly its 9 original opening-balance rows and 0 rows from any other `source_type`.

### Test roster — The Testworth Family (all 5 platform roles + cross-family control)

| Member | fm_id | role | dashboard_mode |
|---|---|---|---|
| Sarah (mom) | `606aad81-7c59-45af-8770-2df484e4418f` | primary_parent | adult |
| Mark (dad) | `5f314a51-7c4d-41e3-801d-0aa7e45e54da` | additional_adult | adult |
| Amy | `008408a7-aefe-43d5-925a-32b0e054c6a0` | special_adult | adult |
| Kylie | `38f9a37f-290d-4700-b3d7-562ea94012c3` | special_adult | adult |
| Alex | `a6af8740-cc21-4ebb-8f78-c222dab7310f` | member | independent (teen) |
| Casey | `240af2a3-ffd2-4fbe-9028-cad8b3456d1a` | member | independent (teen) |
| Jordan | `01ef28d2-b9eb-49aa-9eab-868258723f15` | member | guided |
| Ruthie | `15d6de8d-d020-46a3-b942-d2cba788ed47` | member | play |

Cross-family control: OurFamily members (Tenise `fcac562b-b7f2-412b-8e25-33a1e94cc13b`, Gideon `5aca243a-5f2e-425d-bc25-599d79e83a4f`) used to confirm no cross-family leakage.

### 1. RLS enabled (direct `pg_class` check, not an anon-query inference)

```sql
SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'point_transactions';
-- point_transactions | relrowsecurity=true | relforcerowsecurity=false
```
**PASS** — RLS is genuinely enabled at the catalog level.

### 2. Policy inventory — exactly one policy exists

```sql
SELECT polname, polcmd, pg_get_expr(polqual, polrelid), pg_get_expr(polwithcheck, polrelid)
FROM pg_policy WHERE polrelid = 'public.point_transactions'::regclass;
```
Result: **`pt_select`** only, `polcmd = 'r'` (SELECT). `USING`: member sees own rows OR caller is `primary_parent` of the same family. No INSERT/UPDATE/DELETE policy of any kind exists (matches the migration's design comment — "no client write policies exist on this table by design").

### 3. SELECT scoping — all 5 roles, live query results

| # | Role/Member | Query | Expected | Actual | Result |
|---|---|---|---|---|---|
| 1 | Sarah (mom) | Count all Testworth family rows | 9 (family-wide) | 9 | PASS |
| 2 | Sarah (mom) | Count Mark's row | 1 | 1 | PASS |
| 3 | Sarah (mom) | Count Alex's row | 1 | 1 | PASS |
| 4 | Sarah (mom) | Count Amy's (special_adult) row | 1 | 1 | PASS |
| 5 | Mark (dad) | Count ALL visible rows | 1 (own only) | 1 | PASS |
| 6 | Mark (dad) | Count own row | 1 | 1 | PASS |
| 7 | Mark (dad) | Count Alex's row | 0 | 0 | PASS |
| 8 | Mark (dad) | Count Sarah's (mom) row | 0 | 0 | PASS — Dad cannot read Mom's ledger |
| 9 | Amy (special_adult) | Count ALL visible rows | 1 (own only) | 1 | PASS |
| 10 | Amy (special_adult) | Count own row | 1 | 1 | PASS |
| 11 | Amy (special_adult) | Count Casey's row | 0 | 0 | PASS |
| 12 | Amy (special_adult) | Count Sarah's (mom) row | 0 | 0 | PASS |
| 13 | Alex (independent teen) | Count ALL visible rows | 1 (own only) | 1 | PASS |
| 14 | Alex (independent teen) | Count own row | 1 | 1 | PASS — kid-visible ledger history confirmed working (PRD addendum intent) |
| 15 | Alex (independent teen) | Count Casey's row | 0 | 0 | PASS |
| 16 | Alex (independent teen) | Count Mark's row | 0 | 0 | PASS |
| 17 | Jordan (guided) | Count ALL visible rows | 1 (own only) | 1 | PASS |
| 18 | Jordan (guided) | Count own row | 1 | 1 | PASS |
| 19 | Jordan (guided) | Count Sarah's (mom) row | 0 | 0 | PASS |
| 20 | Ruthie (play) | Count ALL visible rows | 1 (own only) | 1 | PASS |
| 21 | Ruthie (play) | Count own row | 1 | 1 | PASS |
| 22 | Sarah (Testworth mom) | Count OurFamily/Tenise's row (different family) | 0 | 0 | PASS — no cross-family leakage |
| 23 | Sarah (Testworth mom) | Count OurFamily/Gideon's row (different family) | 0 | 0 | PASS — no cross-family leakage |
| 24 | anon (unauthenticated) | Count ALL rows, any family | 0 | 0 | PASS |

**Every role behaved exactly as designed:** mom/primary_parent sees the full family ledger (needed for Family Overview / mom-facing points displays); every other role — dad, both special adults, both teens, the guided kid, the play kid — sees only their own single opening-balance row and nothing else, including no visibility into siblings' or the mom's rows. This is a stricter scoping than most other tables in this file (e.g. `family_members` gives Dad "Scoped" access, not "own only") — intentional per the addendum, matching the `financial_transactions` privacy posture (Convention #225-adjacent: this is a points ledger, not a general family_members table).

### 4. Write-path lockdown — INSERT/UPDATE/DELETE all blocked for `authenticated`

Table-level GRANTs are Supabase's standard broad defaults (`anon`/`authenticated`/`service_role` all hold INSERT/UPDATE/DELETE/SELECT at the SQL grant layer — confirmed via `information_schema.role_table_grants`) — RLS is the only gate, same posture as every other append-only ledger in this codebase.

| # | Role | Operation | Target | Expected | Actual | Result |
|---|---|---|---|---|---|---|
| 25 | Mark (dad) | `INSERT` a row for himself | Own fm_id, `amount=1000` | Blocked — no INSERT policy exists at all | `ERROR 42501: new row violates row-level security policy for table "point_transactions"` | PASS — blocked |
| 26 | Mark (dad) | `UPDATE` his own row's `amount` | Own row | Blocked — no UPDATE policy, 0 rows silently filtered | `0 rows updated` | PASS — blocked, even for own row |
| 27 | Sarah (mom) | `DELETE` Mark's row | Mark's row, same family, mom = primary_parent | Blocked — no DELETE policy for ANY role, including mom | `0 rows deleted` | PASS — blocked even for mom |

Row 27 confirms the ledger is genuinely append-only even for the primary_parent — mom's family-wide SELECT visibility does NOT extend to mutation, matching the migration's explicit design intent ("Never UPDATE, never DELETE" — Convention #223).

### 5. RPC-level lockdown — `record_point_transaction` unreachable by clients; `grant_points` unaffected

| # | Test | Expected | Actual | Result |
|---|---|---|---|---|
| 28 | `authenticated` (Mark) calls `record_point_transaction(...)` directly via RPC | Blocked — EXECUTE revoked from anon/authenticated | `ERROR 42501: permission denied for function record_point_transaction` | PASS — blocked |
| 29 | `authenticated` (Mark) calls `grant_points(...)` (unchanged external contract) | Succeeds — EXECUTE still granted to authenticated; internally short-circuits since Mark's gamification is disabled | `{"status": "no_op", "error_message": "gamification disabled for this member"}` | PASS — not a permission error, correct business-logic response |
| 30 | `authenticated` (Alex, gamification ENABLED) calls `grant_points(..., 5)` on himself, then checks `point_transactions` for a matching `source_type='contract_grant'` row in the SAME transaction (rolled back after) | `grant_points` succeeds AND a ledger row is written — proving the internal SECURITY DEFINER→SECURITY DEFINER call chain (`grant_points` → `record_point_transaction`) works despite the REVOKE ALL on `record_point_transaction` for `authenticated` | 1 ledger row written | PASS — internal privilege chain confirmed working end-to-end |

Row 30 is the load-bearing proof: the REVOKE on `record_point_transaction` blocks *direct* client RPC calls (row 28) without blocking *internal* calls from other SECURITY DEFINER functions like `grant_points` (row 30), because a SECURITY DEFINER function executes its body with the definer's (table owner's) privileges regardless of the calling session's grants. This is the exact `evaluate_family_goal_award` precedent from migration `00000000100284` that the migration's own comments cite.

### 6. Residue check

```sql
SELECT count(*) AS testworth_pt_rows,
       count(*) FILTER (WHERE source_type <> 'opening_balance') AS non_opening_balance_rows
FROM point_transactions pt JOIN families f ON f.id = pt.family_id
WHERE f.family_name = 'The Testworth Family';
-- testworth_pt_rows=9, non_opening_balance_rows=0
```
**PASS** — all 30 probes above (including every mutation attempt) left zero permanent trace. The table still holds exactly the 9 opening-balance rows seeded by the migration.

### Overall: PASS — no gaps found

- RLS is enabled and enforced at the database layer, not just assumed from policy presence.
- Read scoping is correct for all 5 roles: mom sees the whole family; every other role (dad, special adult ×2, independent teen ×2, guided, play) sees only their own row(s), with zero cross-member and zero cross-family leakage.
- The append-only contract is real, not just documented: no role — not dad, not even mom/primary_parent — can INSERT, UPDATE, or DELETE a row directly. The only mutation path is the single SECURITY DEFINER choke point `record_point_transaction()`, which is itself unreachable via direct RPC from any client role.
- `grant_points()`'s existing external contract (callable by `authenticated`, used by the connector/godmother pipeline and any future direct client callers) is preserved and continues to work correctly end-to-end through the new ledger, including successfully writing through the revoked inner function via the SECURITY DEFINER privilege chain.

No CRITICAL, ERROR, or WARNING findings for this table.

---

## Migration 100296 — Point Economy Slice A2 function-security verification (2026-07-07)

**Overall result: 1 CRITICAL finding requiring a fix before this slice is proof-complete.** Everything else — new columns, the new partial unique index, the CHECK-constraint widening, and the re-locked-down `record_point_transaction`/`ensure_point_economy_contracts` — verified clean. Migration `00000000100296` adds no new tables and makes no RLS policy changes; this section verifies the new/rewritten SECURITY DEFINER functions and the schema additions via live behavioral probes against the linked production database (project ref `vjfbzpliqialqmabfnxs`), using the same `supabase db query --linked` + JWT-claim-impersonation methodology as the 100295 verification above. All mutation probes wrapped in `BEGIN...ROLLBACK`; a full residue check at the end confirms zero permanent trace.

### Test roster (same Testworth Family + OurFamily rosters as prior verifications)

Attacker used throughout: **Sarah** (Testworth Family, primary_parent), user_id `81246f0f-ab60-4932-8914-2a48b97b274c`. Victim used throughout: **Helam** (OurFamily, independent teen), fm_id `b266cf06-d2b4-4c7b-a6bd-559224367005`, family_id `4bc86323-545b-4faf-b31f-3926fdd8c5a6`. Sarah and Helam have zero relationship — different families, no shared membership, no `member_permissions` grant of any kind.

### 1. Schema additions (columns, index, CHECK constraints) — all confirmed present

| # | Check | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | `gamification_configs.intention_tally_points` / `daily_points_goal` | Present, INTEGER, nullable | Present | PASS |
| 2 | `task_templates.routine_points_mode` / `routine_step_points` / `routine_completion_points` | Present; `routine_points_mode` TEXT NOT NULL DEFAULT `'none'` | Present, default confirmed `'none'::text` | PASS |
| 3 | `task_template_steps.reward_type` / `reward_amount` / `reward_description` / `reward_image_url` / `reward_image_asset_key` | Present, nullable | Present | PASS |
| 4 | `idx_earned_prizes_routine_step_source` partial unique index | `UNIQUE (source_id) WHERE source_type = 'routine_step'` | Confirmed via `pg_indexes` — exact definition matches | PASS |
| 5 | `contracts_source_type_check` contains `'daily_points_goal_met'` | Present in the 11-value ANY() list | Confirmed via `pg_get_constraintdef` | PASS |
| 6 | `deed_firings_source_type_check` contains `'daily_points_goal_met'` | Present in the 11-value ANY() list | Confirmed via `pg_get_constraintdef` | PASS |

No RLS changes ride along with any of these — the owning tables (`gamification_configs`, `task_templates`, `task_template_steps`, `contracts`, `deed_firings`, `earned_prizes`) keep whatever RLS posture they had before this migration. Not re-verified here since 100296 doesn't touch any policy on them.

### 2. `record_point_transaction` — re-confirmed STILL locked down after the rewrite

The 100296 rewrite (adding the daily-points-goal crossing tail block) keeps the exact same 9-parameter signature as the 100295 original, so `CREATE OR REPLACE FUNCTION` genuinely replaced the same function object rather than creating a co-existing overload — and the migration re-applies the identical `REVOKE ALL ... FROM PUBLIC / anon, authenticated` + `GRANT ... TO service_role` block immediately after the rewrite (lines 440-448).

| # | Test | Expected | Actual | Result |
|---|---|---|---|---|
| 7 | `pg_proc.proacl` for `record_point_transaction` | No `anon=`/`authenticated=` grant; only `postgres=X/postgres, service_role=X/postgres` | `postgres=X/postgres, service_role=X/postgres` | PASS |
| 8 | Mark (Testworth dad, `authenticated`) calls `record_point_transaction(...)` directly via RPC | Blocked — `permission denied` | `ERROR: permission denied for function record_point_transaction` | PASS — still blocked |

### 3. `ensure_point_economy_contracts` — internal-only, confirmed locked down

| # | Test | Expected | Actual | Result |
|---|---|---|---|---|
| 9 | `pg_proc.proacl` | No `anon=`/`authenticated=` grant | `postgres=X/postgres, service_role=X/postgres` | PASS |
| 10 | Mark (`authenticated`) calls `ensure_point_economy_contracts(...)` directly via RPC | Blocked — `permission denied` | `ERROR: permission denied for function ensure_point_economy_contracts` | PASS — blocked |

This function is only reachable via the `trg_gc_ensure_point_economy_contracts` trigger on `gamification_configs` (fires as the table owner regardless of who triggers the UPDATE, same SECURITY DEFINER privilege-chain pattern verified for `grant_points → record_point_transaction` in the 100295 section above), and via the migration's own one-time backfill `DO` block.

### 4. `execute_points_godmother` — PUBLIC-executable, but confirmed a pre-existing platform-wide pattern, NOT newly introduced or worsened by this migration

`execute_points_godmother`'s `proacl` is `=X/postgres, postgres=X/postgres, anon=X/postgres, authenticated=X/postgres, service_role=X/postgres` — the `=X/postgres` entry is a grant to `PUBLIC`, meaning any authenticated (or even anon) role can call it directly by RPC, bypassing the `dispatch_godmothers` contract-matching pipeline entirely.

**This is not new.** No migration — not 100296, not any of its 100207-100269 predecessors — has ever issued a `REVOKE` against `execute_points_godmother` or any of its sibling `execute_*_godmother` functions. A direct `pg_proc.proacl` comparison across **all 11** `execute_*_godmother` functions plus `dispatch_godmothers` itself plus the two generic reusable grant RPCs shows byte-identical exposure:

| Function | `proacl` |
|---|---|
| `dispatch_godmothers` | `=X/postgres, postgres=X/postgres, anon=X/postgres, authenticated=X/postgres, service_role=X/postgres` |
| `execute_points_godmother` (rewritten by 100296) | same |
| `execute_money_godmother` | same |
| `execute_victory_godmother` | same |
| `execute_custom_reward_godmother` | same |
| `execute_prize_godmother` | same |
| `execute_recognition_godmother` | same |
| `execute_assign_task_godmother` | same |
| `execute_allowance_godmother` | same |
| `execute_numerator_godmother` | same |
| `execute_family_victory_godmother` | same |
| `execute_creature_godmother` | same |
| `execute_page_unlock_godmother` | same |
| `grant_points` | same |
| `grant_money` | same |

100296's rewrite of `execute_points_godmother` (Part 9 — config-as-truth resolution) touches only the function *body*; it issues no `GRANT`/`REVOKE` statement at all, so the ACL carries forward unchanged from its original 100210 creation. Verified: a direct forged-payload RPC call to `execute_points_godmother` bypassing `dispatch_godmothers`'s contract-matching would indeed work today for any `authenticated` caller (same mechanism proven live against `process_routine_step_completion` below) — but this capability already existed identically for `execute_money_godmother` and all 9 other siblings since Phase 3 (migrations 100207-100219), completely independent of this migration. **Not flagged as a new or worsened finding for 100296.** Recommend a separate, dedicated platform-wide hardening pass (`REVOKE ALL ... FROM PUBIC` across all 11 `execute_*_godmother` functions + `dispatch_godmothers`, granting only to `service_role`, since nothing in the client codebase calls these directly — only the `trg_deed_firings_dispatch` trigger does) rather than a one-off fix scoped to points.

### 5. `process_routine_step_completion` — **CRITICAL: cross-family unauthorized state mutation, live-exploited and confirmed**

This is the one genuinely new authorization-relevant surface in the migration (per its own design comment, lines 65-69), and it does not hold up under a live probe.

**Setup:** a real production `routine_step_completions` row belonging to **Helam** (OurFamily, family_id `4bc86323-...`) was used as the target: `completion_id = a5a99267-6a38-45f2-95c4-657348b73d03`, `step_id = da0b24b4-4b28-4628-a22c-ee176b3b979e` ("Clean bathroom mirrors," Bathroom Cleaning routine). A reward was configured on the step (as the elevated/service-equivalent role, simulating mom's own legitimate configuration in her own family) so the payout path was genuinely exercised rather than a no-op — this is not a synthetic/fabricated row, it's real production data with a real reward attached, matching exactly how any mom would configure Rewarded Step Task Prizes.

**Attack:** switched to `authenticated` as **Sarah**, primary_parent of **The Testworth Family** — a completely unrelated family with zero membership, zero grant, and (confirmed independently) zero read visibility into either the completion row or Helam's `family_members` row under normal RLS. Called `process_routine_step_completion('a5a99267-6a38-45f2-95c4-657348b73d03')` directly via RPC.

| # | Sub-test | Expected | Actual | Result |
|---|---|---|---|---|
| 11 | Sarah `SELECT`s the target `routine_step_completions` row under her own session (RLS baseline) | 0 rows (no relationship) | 0 rows | PASS — confirms this is a pure RPC-authorization gap, not a data-read leak |
| 12 | Sarah `SELECT`s Helam's `family_members` row under her own session | 0 rows (no relationship) | 0 rows | PASS |
| 13 | **Points path** — reward_type=`'stars'`, amount=7 configured on the step; Sarah calls `process_routine_step_completion` on Helam's completion | Should be blocked (`Not authorized` or similar), since Sarah has no relationship to OurFamily | **NOT blocked.** Returned `{"status":"processed","step_points":{"status":"recorded","balance_after":37,...}}`. Helam's `gamification_points` moved 30 → 37. A real `point_transactions` row was inserted crediting **Helam** (`family_member_id` = Helam's fm_id, not Sarah's), `acted_by: null` | **FAIL — CRITICAL** |
| 14 | **Money path** — same completion, reward_type=`'money'`, amount=$25.00 configured on the step; Sarah calls the RPC again | Should be blocked | **NOT blocked.** Returned `{"status":"processed","step_money":{"status":"granted","balance_after":25.00,...}}`. A real `financial_transactions` row was inserted crediting **Helam** with $25.00, `transaction_type='opportunity_earned'` | **FAIL — CRITICAL** |
| 15 | Prize path (`reward_type IN ('privilege','custom')` → `earned_prizes` INSERT) | Not independently live-tested (same code path, same absence of any auth check as the two paths above — presumed equally exploitable; not re-run a third time to avoid redundant production writes for a pattern already twice-proven) | — | Presumed vulnerable by code inspection |
| 16 | Does the payout ever redirect to the **caller** (Sarah) instead of the completion row's own `member_id` (Helam)? | Should never redirect — this is the "blast radius bounded by the row's own state" claim in the migration's design comment | Confirmed: in both sub-tests, `family_member_id` on the new ledger row was always Helam's, never Sarah's. The function reads `v_completion.member_id` exclusively for attribution; nothing derived from the caller's identity ever reaches the payout target | PASS — no self-enrichment/redirection vector |
| 17 | Residue check after both attacks (rolled back) | Helam's points back to 30, balance back to $0.00, step `reward_type` back to `NULL`, zero orphaned `point_transactions`/`financial_transactions` rows | Confirmed clean on all four | PASS |

**Root cause:** `process_routine_step_completion(p_completion_id UUID)` is `SECURITY DEFINER` and is explicitly `GRANT`ed to `authenticated` (Part 11, intentional — Slice A3's client hook is meant to call it directly). Its body performs **zero authorization check** — no `auth.uid()` lookup, no verification that the calling session belongs to the same family as `v_task.family_id`/`v_completion.member_id`. It trusts that any `p_completion_id` value handed to it is legitimate. This is a materially different situation from its sibling `get_member_day_obligations` and `calculate_allowance_progress` (both rewritten in the immediately-preceding migration 100295, in the same body-of-work) — **both of those explicitly gate with an in-body `auth.uid()`-vs-family check and `RAISE EXCEPTION 'Not authorized'`** when the caller isn't a member of the subject's family. `process_routine_step_completion` was written to the opposite standard within the same two-migration slice.

The migration's own comment defends the omission as "matching the established no-explicit-auth-check pattern for RPCs whose blast radius is bounded by an existing row's own state" — sub-test 16 confirms that reasoning is correct **for who receives the payout** (always the completion's own member, never the caller), but sub-tests 13-14 prove it does **not** hold for **who can trigger the payout at all**. Any authenticated user on the entire platform — any family, any role, including a child's own PIN-derived session — can force a real, ledger-recorded points and/or money grant onto any other family's member, with no consent, no relationship check, and no attribution trail pointing back to the true caller (the ledger's `acted_by` column is left `NULL`; nothing in either write records that Sarah was the actor). This is a genuine multi-tenant isolation violation, not merely a reward-mechanics quirk — and unlike the pre-existing godmother-function exposure (§4 above), `process_routine_step_completion` is **brand new in this migration** and was **deliberately, explicitly granted** to `authenticated` by design, so it cannot be waved off as inherited legacy exposure.

**Practical exploitability note:** `routine_step_completions.id` values are UUIDs and are not exposed in any public URL or API response today, so this is not a trivially walk-up-and-exploit vector for an anonymous stranger — but it requires only an `authenticated` session (any family member on the platform, including a kid), and any future surface that ever renders or logs a `completion_id` to a non-owning context (shared links, activity feeds, error messages, browser devtools on a shared/library device, screen-shares) turns it into a live attack. The bar for "authenticated" on this platform is also low relative to the sensitivity of the target (real money): PIN-only child sessions and family-shadow-device sessions both qualify.

**Recommended fix (not yet applied — this is the CRITICAL blocking finding):** add the same in-body authorization pattern used by `get_member_day_obligations`/`calculate_allowance_progress` in the immediately-preceding migration: resolve the completion's owning family via `v_task.family_id`, then require `auth.role() = 'service_role'` OR the caller (`auth.uid()`) to be a `family_members` row in that same family, `RAISE EXCEPTION 'Not authorized'` otherwise. This is a small, additive, non-breaking change — Slice A3's legitimate client call site (a member completing their own routine step) will always satisfy this check, since the completion row and the caller are, by construction, in the same family for every real usage.

### 6. `member_points_today` — confirmed cross-family aggregate leak, but matches an established low-severity precedent (not newly introduced)

| # | Test | Expected | Actual | Result |
|---|---|---|---|---|
| 18 | `pg_proc.proacl` | `GRANT ... TO authenticated, service_role` (intentional per Part 7 — meant to be publicly queryable, matching the kid-visible-ledger precedent) | Confirmed granted to `authenticated` | Matches design |
| 19 | Sarah (Testworth, `authenticated`) calls `member_points_today('<Helam's fm_id>')` after a real 42-point `earn` transaction was seeded for Helam today | Ideally blocked or empty, since Sarah has no relationship to Helam | **Leaked.** Returned `42` — the correct real value | **Confirmed leak, WARNING not CRITICAL** |
| 20 | Same session, direct row-level read: `SELECT count(*) FROM point_transactions WHERE family_member_id = '<Helam>'` | 0 (RLS-blocked) | 0 | PASS — the underlying ledger table itself is correctly scoped; only the aggregate function bypasses it |

**Why this is not treated as a new severity class:** the function has no `auth.uid()` check anywhere in its body, and this is not novel — it is byte-for-byte the same design pattern as `public.calculate_running_balance(p_member_id)` (created in migration 100209, `LANGUAGE sql STABLE SECURITY DEFINER`, `SELECT COALESCE(SUM(amount),0) ... WHERE family_member_id = p_member_id` with **no auth check**, `GRANT`ed to `authenticated` and never revoked) and `public.family_today(p_member_id)` (migration 100158, same shape, no auth check). `calculate_running_balance` is the more sensitive precedent — it leaks a real dollar balance, not merely a points-today sum — and it has carried this exact posture in production, unrevoked, since 100209. `member_points_today` is a new instance of an already-established convention: scalar/aggregate-returning helper RPCs on this platform trust the caller and skip the auth check; row-returning RPCs (`get_member_day_obligations`, `calculate_allowance_progress`) get the explicit check because they'd otherwise leak row-level detail. The exposure surface here is narrow — a bare integer, no names, no descriptions, no timestamps — and the underlying ledger table's own RLS is unaffected and independently verified correct (sub-test 20). **Recorded as a confirmed, low-severity, pre-existing-pattern finding — not blocking, but worth sweeping into the same future hardening pass recommended in §4** (a one-line `auth.uid()`-vs-family check would close all three of `member_points_today` / `calculate_running_balance` / `family_today` at once, if the founder ever wants that swept up).

### 7. Adjacent observation (pre-existing, out of scope, noted for context only)

While verifying the `deed_firings_source_type_check` widening, the pre-existing `deed_firings_insert_family` RLS policy (created in migration 100200, long before this slice) was inspected for interaction effects. Its `WITH CHECK` clause scopes only `family_id` to the caller's own family — it does **not** constrain `family_member_id` to the caller's own member row. This means any authenticated family member (including a child) can already `INSERT` a `deed_firings` row crediting a **sibling** within their own family with any of the 11 now-legal `source_type` values (including the new `'daily_points_goal_met'`), which would fire the existing `trg_deed_firings_dispatch` trigger and could award real value if a matching contract exists. This is entirely pre-existing (not created, changed, or widened in kind by 100296 — only the enum of legal `source_type` strings grew by one), is a within-family (not cross-family) authorization question, and was not part of the explicit scope of this review. Flagged here only as context; not evaluated further and not counted toward this migration's pass/fail.

### Summary

| Item | Verdict |
|---|---|
| New columns (5 tables/10 columns) | PASS |
| `idx_earned_prizes_routine_step_source` partial unique index | PASS |
| `contracts`/`deed_firings` CHECK widening | PASS |
| `record_point_transaction` still locked down post-rewrite | PASS |
| `ensure_point_economy_contracts` locked down | PASS |
| `execute_points_godmother` PUBLIC-exposed | Confirmed pre-existing platform-wide pattern (all 11 godmothers + `dispatch_godmothers` + `grant_points`/`grant_money`) — not new, not worsened by this migration |
| `process_routine_step_completion` cross-family exploit | **CRITICAL — confirmed live, both points and money paths. Fix required before this slice is proof-complete.** |
| `member_points_today` cross-family aggregate leak | Confirmed, but matches an established low-severity precedent (`calculate_running_balance`, `family_today`) — WARNING, not blocking |
| `deed_firings` sibling-crediting (adjacent, pre-existing) | Noted for context, out of scope |

**Verdict: FAIL — one CRITICAL finding.** Migration 100296's schema changes, the `record_point_transaction`/`ensure_point_economy_contracts` lockdown, and the config-as-truth resolution logic in `execute_points_godmother` are all sound. The blocking issue is `process_routine_step_completion`'s complete absence of a family-membership authorization check, live-proven to allow any authenticated platform user to force real points and real money onto any other family's member. This must be fixed (add the `get_member_day_obligations`-style in-body auth check) before Slice A3 wires a client call site to this function — right now the exposure is inert only because nothing calls it yet.

---

## Migration 100298 — `process_routine_step_completion` auth-fix re-verification (2026-07-07)

**Overall result: FIX CONFIRMED for `process_routine_step_completion`, PLUS TWO NEW CRITICAL FINDINGS discovered during the mandated re-sweep of the rest of 100296.** The corrective migration `00000000100298_process_routine_step_completion_auth_fix.sql` was applied to linked production (project ref `vjfbzpliqialqmabfnxs`) and is fully verified: the original cross-family exploit is now blocked, legitimate same-family use (including cross-member "mom acting on a sibling's behalf" and the service_role bypass) is unaffected, and the fix is a surgical, diff-confirmed patch with zero collateral change to the reward logic. However, while re-sweeping the rest of 100296 per this task's item 4, the same missing-authorization-check root cause was found to be **live-exploitable, not merely theoretical,** in two sibling functions — `execute_points_godmother` and `execute_money_godmother` — and both were proven with real (rolled-back) mutations against production data. These are new blocking findings, separate from and in addition to the fix being verified here.

All probes below run via `supabase db query --linked` with `SET LOCAL ROLE` + `SET LOCAL request.jwt.claims` JWT-claim impersonation, matching the established methodology in this file. All mutation probes wrapped in `BEGIN...ROLLBACK`. A full residue check follows each probe set; every one confirms zero permanent trace.

### 1. Diff-confirmed: the fix is exactly what it claims to be

A tool diff (`diff`, not manual inspection) of the `process_routine_step_completion` body in migration 100296 (lines 734–939) against migration 100298 (lines 48–272) shows the **only** differences are:

1. One new declaration: `v_authorized BOOLEAN := FALSE;`
2. One new 18-line block, inserted immediately after the `v_task` lookup (`IF v_task.id IS NULL THEN RETURN ...; END IF;`) and immediately before the `v_template` lookup — i.e., after the task's `family_id` is known, but before any points/prize/money computation:
   ```sql
   IF auth.role() = 'service_role' THEN
     v_authorized := TRUE;
   ELSIF auth.uid() IS NOT NULL THEN
     SELECT EXISTS (
       SELECT 1 FROM public.family_members caller
       WHERE caller.family_id = v_task.family_id
         AND caller.user_id = auth.uid()
     ) INTO v_authorized;
   END IF;

   IF NOT v_authorized THEN
     RAISE EXCEPTION 'Not authorized';
   END IF;
   ```

Every other line — variable names, the points path, the prize/money path, the per-completion evaluation, all comments, all whitespace — is byte-for-byte identical between the two migrations. The migration's own claim ("Rest of the function body is BYTE-FOR-BYTE identical to the 100296 definition") is **confirmed true by direct diff**, not taken on faith.

### 2. Exploit reproduction — now blocked

Reproduced the exact original live exploit: Sarah (primary_parent, **The Testworth Family**, `fm_id 606aad81-7c59-45af-8770-2df484e4418f`, `user_id 81246f0f-ab60-4932-8914-2a48b97b274c`) — a completely unrelated family — attacked two real `routine_step_completions` rows belonging to Helam (**OurFamily**, `fm_id b266cf06-d2b4-4c7b-a6bd-559224367005`, gamification_points baseline 30), task "Bathroom Cleaning" (`8fe5f84f-bc4b-4f64-a9ca-9362d163ce74`).

| # | Test | Step reward configured | Expected | Actual | Result |
|---|------|------------------------|----------|--------|--------|
| 1 | **EXPLOIT-STARS** — Sarah calls `process_routine_step_completion('a5a99267-6a38-45f2-95c4-657348b73d03')`, the identical completion row from the original finding | `reward_type='stars', reward_amount=7` | Blocked | `RAISE EXCEPTION` caught: `sqlstate=P0001, message='Not authorized'`. Helam's `gamification_points` unchanged (30 before, 30 after) | **PASS — BLOCKED** |
| 2 | **EXPLOIT-MONEY** — Sarah calls the RPC on a second real completion (`bf9f3372-92d6-411c-8e93-7b869ad393ec`) | `reward_type='money', reward_amount=25.00` | Blocked | `sqlstate=P0001, message='Not authorized'`. Helam's `financial_transactions` count unchanged (23 before, 23 after) | **PASS — BLOCKED** |
| 3 | **EXPLOIT-NO-JWT** — `authenticated` postgres role with `request.jwt.claims` entirely unset (`auth.uid()` resolves `NULL`) calls the RPC on a third real completion | `reward_type` unset | Blocked (edge case: confirms the `ELSIF auth.uid() IS NOT NULL` guard, not a `NULL = NULL` false-positive) | `sqlstate=P0001, message='Not authorized'` | **PASS — BLOCKED** |

### 3. Legitimate use — confirmed NOT broken, and confirmed family-membership (not identity) is what's enforced

All four sub-tests below ran against real OurFamily data, in the same transaction, immediately after the exploit attempts against the *same* completion rows failed cleanly (proving the failed attempts left no idempotency-key residue that would have blocked the legitimate follow-up call).

| # | Test | Caller | Target completion (member) | Expected | Actual | Result |
|---|------|--------|------------------------------|----------|--------|--------|
| 4 | **LEGIT-SELF** | Helam (`75a9aa25-e980-4ed0-8a75-257fec7f9e8f`) — member processing his **own** completion | `a5a99267...` (Helam), stars/7 — same row Sarah just failed to attack | Success | `{"status":"processed","step_points":{"status":"recorded","balance_after":37,...}}`. Points 30→37 | **PASS** |
| 5 | **LEGIT-MOM** | Tenise (`7434224b-ebb4-4138-8bd8-9fbc62259c42`) — `primary_parent`, a **different member** of the same family, acting on a sibling's completion | `bf9f3372...` (Helam), money/$25.00 | Success, and payout credited to **Helam**, not Tenise | `{"status":"processed","step_money":{"status":"granted","balance_after":25.00,...}}`. Helam's `financial_transactions` count 23→24; Tenise's own `financial_transactions`/`gamification_points` stayed at their baseline (0/0) throughout every sub-test | **PASS** — confirms the gate is family-membership, not caller-identity, and confirms the payout always follows the completion row's own `member_id`, never the caller |
| 6 | **LEGIT-DAD** | Jerrod (`44a07ad8-94ca-4dd4-84d8-42ae103cf1a6`) — `additional_adult`, **yet another** different member of the same family | `53c91e51...` (Helam), stars/3 | Success | `{"status":"processed","step_points":{"status":"recorded","balance_after":40,...}}`. Points 37→40 | **PASS** — confirms "any member, any role, same family" is honored, not just mom/primary_parent |
| 7 | **SERVICE-ROLE** | `auth.role()='service_role'` (no `sub` needed — first-branch short-circuit) | `81ee6931...` (Helam), stars/2 | Success | `{"status":"processed","step_points":{"status":"recorded","balance_after":42,...}}`. Points 40→42 | **PASS** — confirms the service_role bypass branch still functions, matching the client-side-hook/server-processing invocation path this function is designed for |

Cumulative math checked and matched exactly at every checkpoint: `30 (baseline) + 7 (self) + 3 (dad) + 2 (service) = 42` final `gamification_points`; `23 (baseline) + 1 (mom-on-behalf-of-Helam money grant) = 24` final `financial_transactions` count; `point_transactions` count moved `1 → 4` (three successful stars-path calls: self, dad, service-role — the money path correctly does not touch this table). Every number landed exactly on the predicted value with no unexplained deltas.

Testworth (Sarah's own family) has zero `routine_step_completions` data (all its tasks are plain `task_type='task'`, no routine templates), so an in-family "Sarah processes her own family's completion" test could not be run against real data; this gap is judged immaterial given sub-tests 4–7 already prove the family-membership check accepts the correct family across three different caller identities and two different reward paths, and rejects it across three different attack shapes (points, money, and no-JWT) — the boundary is proven from both sides.

### 4. Residue check — zero permanent trace

A separate, fresh (non-transactional) read-only query after `ROLLBACK` confirmed: Helam's `gamification_points` back to 30, `financial_transactions` count back to 23, `point_transactions` count back to 1, all 4 mutated `task_template_steps.reward_type` values back to `NULL`, and the session-scoped `pg_temp` helper functions/tables gone (0 rows in `pg_proc` for the probe helper names — expected, since `pg_temp` objects are connection-scoped and the connection closed after the query file completed).

### 5. Sweep of the rest of migration 100296 (task item 4) — **two additional live-exploitable CRITICAL findings**

**5a. `execute_points_godmother` — live-exploitable via direct RPC, worse in one respect than the original finding: no real row of any kind needs to exist.**

Read the live function definition (`pg_get_functiondef`) directly rather than trusting the prior write-up's characterization. Confirmed: `v_family_id`, `v_member_id`, `v_source_type`, `v_source_id` are all read **directly from the caller-supplied `p_deed_firing` JSONB parameter** with no independent lookup or validation against any real row, and `v_points` can be taken **directly from the caller-supplied `p_payload->>'payload_amount'`** before the "config-as-truth" resolution logic is ever reached. The `p_contract_id` parameter is accepted but is **never referenced anywhere in the function body** — it is entirely decorative. The function has **zero authorization check** of any kind (no `auth.uid()`, no `auth.role()`, nothing).

Grant check (`pg_proc.proacl`) confirms this is not merely theoretical: `execute_points_godmother` is `EXECUTE`-granted to **`anon`, `authenticated`, AND `service_role`, all via PUBLIC** — identical to before 100296 and unchanged by 100298 (100298 touches only `process_routine_step_completion`). This grant status was independently re-confirmed live in this pass, not assumed from the prior write-up.

**Live probe (wrapped in `BEGIN...ROLLBACK`):** Sarah (Testworth, authenticated, zero relationship to OurFamily) called `execute_points_godmother(gen_random_uuid(), '{"family_id":"4bc86323-...","family_member_id":"b266cf06-...","source_type":"task_completion","source_id":null}'::jsonb, '{"payload_amount":999999}'::jsonb, 'immediate')` — a **completely fabricated** deed-firing payload; no `deed_firings` row, no `contracts` row, no `routine_step_completions` row exists anywhere for this call.

Result: **`{"status":"granted","grant_reference":"b266cf06-...","metadata":{"family_member_id":"b266cf06-...","new_total":1000029,"points_awarded":999999}}`.** Helam's `gamification_points` moved from 30 to **1,000,029** in a single call, entirely attacker-controlled, entirely unbounded (no upper-limit check on `payload_amount` anywhere in the function). Rolled back; residue check confirmed 0 leaked rows/functions and points back to 30.

**5b. `execute_money_godmother` — identical flaw, real dollars.** Read the live definition: `v_family_id`, `v_member_id`, `v_amount` are read directly from `p_deed_firing`/`p_payload` with zero validation, then passed straight to `grant_money()`. Zero authorization check.

**Live probe (wrapped in `BEGIN...ROLLBACK`):** Sarah called `execute_money_godmother(gen_random_uuid(), '{"family_id":"4bc86323-...","family_member_id":"b266cf06-...","source_type":"contract_grant","source_id":null}'::jsonb, '{"payload_amount":5000.00,"payload_text":"FORGED-PROBE-DO-NOT-KEEP"}'::jsonb, 'immediate')` — again, no real contract or deed firing exists for this call.

Result: **`{"status":"granted","grant_reference":"...","metadata":{"amount":5000,"balance_after":"5000.00","family_member_id":"b266cf06-..."}}`.** A real `financial_transactions` row for **$5,000.00**, `transaction_type='contract_grant'`, was inserted crediting Helam. Rolled back; residue check confirmed 0 leaked rows and Helam's `financial_transactions` count back to 23 (the `description='FORGED-PROBE-DO-NOT-KEEP'` row count is 0 post-rollback).

**Verdict on 5a/5b: this is not the same "pre-existing, not client-exposed, low blast-radius" pattern the original 100296 review accepted.** That review's reasoning — "nothing in the client codebase calls these directly, only the `trg_deed_firings_dispatch` trigger does" — describes how the *legitimate* system uses these functions, but does not describe what the open `EXECUTE` grant to `anon`/`authenticated` actually permits. This pass **live-proved, with real state mutation on real production data (safely rolled back), that any authenticated user on the platform — and per the `anon` grant, potentially any unauthenticated request bearing only the public anon key — can directly credit unbounded points or unbounded real dollars to any family member on the platform, with zero relationship, zero real underlying record, and zero rate limit.** This is **CRITICAL and blocking**, arguably more severe than the `process_routine_step_completion` finding this migration fixes, because it requires no real `routine_step_completions` row to target — the entire "deed firing" is attacker-fabricated JSON. **Recommended fix, matching the established `process_routine_step_completion`/`get_member_day_obligations`/`calculate_allowance_progress` pattern:** either (a) add the same `auth.role()='service_role' OR caller is member of v_family_id` gate to the top of every `execute_*_godmother` function (there are 11: `execute_allowance_godmother`, `execute_numerator_godmother`, `execute_money_godmother`, `execute_points_godmother`, `execute_prize_godmother`, `execute_victory_godmother`, `execute_family_victory_godmother`, `execute_custom_reward_godmother`, `execute_assign_task_godmother`, `execute_recognition_godmother`, plus `dispatch_godmothers` itself), or (b) `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` on all 11 plus `dispatch_godmothers`, `GRANT EXECUTE ... TO service_role` only — since the audit independently confirmed nothing in the client codebase calls any of these directly, option (b) is the smaller, lower-risk change and mirrors how `record_point_transaction` is already locked down. Either fix should ship before beta; this is a live path to unbounded, unattributed, cross-tenant financial and points fraud today.

**5c. `member_points_today` — re-confirmed leaking, judged to remain WARNING (not escalated) despite the above.** Re-tested live: seeded a real 17-point `earn` transaction for Helam (as service_role, rolled back), then called `member_points_today('b266cf06-...')` as Sarah (Testworth, authenticated) — returned `17`, the correct real value, confirming the read-only aggregate leak still exists and 100298 did not touch it (100298 only modifies `process_routine_step_completion`). **Judgment: this stays WARNING, not CRITICAL,** and is deliberately NOT escalated to the same tier as 5a/5b, because (i) it is read-only — no state mutation, no funds, no points, no durable record is created or altered; (ii) the leaked value is a single small integer with no PII and no content; (iii) exploiting it requires the caller to already possess a valid `family_members.id` UUID (a 128-bit value, not practically enumerable). This is a real boundary bug that should still be fixed (same auth-gate pattern), but its blast radius is trivial next to 5a/5b's unbounded real-value mutation, and conflating the two severities would blur the urgency signal on the two that actually need to block. Recommend fixing all three (`process_routine_step_completion` — done; the 11 `execute_*_godmother` functions — CRITICAL, not done; `member_points_today` — WARNING, not done) in the same follow-up pass, since they share one root cause and one fix pattern.

### 6. Zero residue — final combined check

A final, separate read-only query across all probe sets in this re-verification pass confirmed: `helam_points=30`, `helam_ft_count=23` (no `FORGED-PROBE-DO-NOT-KEEP` rows), `helam_pt_count=1` (no `RLS-VERIFIER-PROBE-SEED` rows), all 4 mutated `task_template_steps` back to `reward_type IS NULL`, and zero leaked `pg_temp` helper functions in `pg_proc`. Every mutation from every probe in this pass — the fix-verification probes, the `execute_points_godmother` exploit, the `execute_money_godmother` exploit, and the `member_points_today` seed — left zero permanent trace.

### Summary

| Item | Verdict |
|---|---|
| `process_routine_step_completion` — cross-family exploit (original CRITICAL finding) | **FIXED, verified live.** Exploit blocked (3/3 attack variants incl. no-JWT edge case); legitimate same-family use unaffected (4/4 variants incl. cross-member and service_role); diff-confirmed the fix changed nothing else. |
| `execute_points_godmother` — direct RPC parameter injection | **NEW CRITICAL, live-exploited and confirmed. Not fixed by 100298 (out of its scope). Blocking.** Unbounded points, no real row required, EXECUTE granted to `anon`. |
| `execute_money_godmother` — direct RPC parameter injection | **NEW CRITICAL, live-exploited and confirmed. Not fixed by 100298 (out of its scope). Blocking.** Unbounded real dollars, no real row required, EXECUTE granted to `anon`. |
| Other 9 `execute_*_godmother` functions + `dispatch_godmothers` | Not individually live-probed this pass (out of the task's explicit scope), but share the identical grant profile and, per the code pattern observed in 2 of 11 siblings, are suspected to share the identical missing-auth-check defect. **Recommend a full sweep before beta.** |
| `member_points_today` — cross-family aggregate leak | Re-confirmed leaking. **Judged WARNING, not escalated** — read-only, single-integer, non-enumerable-UUID-gated. Should still be fixed alongside the above in the same pass. |
| Residue (this pass) | **Zero.** All probes wrapped in `BEGIN...ROLLBACK`; final state matches pre-probe baseline exactly on every metric checked. |

**Verdict: PARTIAL PASS.** The specific fix requested — `process_routine_step_completion`'s authorization gate — is **verified correct and complete**: the original exploit is closed, legitimate usage (including cross-member and service_role paths) is unaffected, and the patch is proven to be surgical (diff-confirmed, no collateral changes). **However, this build is NOT yet safe to consider "proof-complete" for the point economy as a whole.** The mandated re-sweep of the rest of 100296 surfaced two NEW, live-exploitable, CRITICAL, blocking findings — `execute_points_godmother` and `execute_money_godmother` are directly callable by any authenticated (and possibly unauthenticated `anon`) user, accept entirely fabricated JSON with no real underlying record, and grant unbounded points or unbounded real dollars to any family member on the platform with zero relationship check. These must be fixed — and the other 9 sibling `execute_*_godmother` functions plus `dispatch_godmothers` should be swept for the same defect — before this area of the platform is safe to expose to real users.

---

## Migration 100300 — Emergency godmother-execute lockdown + member_points_today auth gate (2026-07-07)

Seat-authorized emergency response to the CRITICAL findings above. Scope, per explicit seat direction: (1) `REVOKE EXECUTE FROM PUBLIC, anon, authenticated` + `GRANT ... TO service_role` on `dispatch_godmothers` and ALL 14 `execute_*_godmother` functions (the full sibling set, not just the 2 live-exploited ones — closing the "suspected to share the identical defect" gap the prior pass flagged for the other 9); (2) add the family-membership auth GATE (not a revoke — this one is legitimately client-called) to `member_points_today`, matching the exact pattern already proven on `process_routine_step_completion`/`get_member_day_obligations`/`calculate_allowance_progress`. Applied via `supabase db query --linked -f supabase/migrations/00000000100300_godmother_execute_lockdown_and_points_today_auth.sql` (migration number re-checked at creation and immediately before apply — 100299 was claimed by a parallel lane in between). Zero logic changes to any of the 15 locked-down function bodies; `member_points_today` rewritten with the gate added, aggregate logic otherwise unchanged.

**Seat's pre-authorization safety check (read-only prod queries, before this migration was written):** confirmed `trg_deed_firing_dispatch` (the AFTER INSERT trigger on `deed_firings`) and `dispatch_godmothers` are both `SECURITY DEFINER` — meaning the legitimate deed→dispatch→godmother chain executes entirely in owner context and cannot be broken by revoking `PUBLIC`/`anon`/`authenticated` EXECUTE on the 15 functions, since Postgres privilege checks for a call made from *within* a `SECURITY DEFINER` function apply to the definer's role, not the original client's role.

### Post-apply proof (all 4 items required by the seat's rider, all PASS, zero residue)

**1. Privilege state, bulk-checked via `has_function_privilege()` (not `proacl` string-matching, which the prior pass's own migration comment flagged as unreliable):**

| Function | `anon` EXECUTE | `authenticated` EXECUTE | `service_role` EXECUTE |
|---|---|---|---|
| `dispatch_godmothers` | false | false | true |
| `execute_allowance_godmother` | false | false | true |
| `execute_assign_task_godmother` | false | false | true |
| `execute_coloring_reveal_godmother` | false | false | true |
| `execute_creature_godmother` | false | false | true |
| `execute_custom_reward_godmother` | false | false | true |
| `execute_family_victory_godmother` | false | false | true |
| `execute_money_godmother` | false | false | true |
| `execute_numerator_godmother` | false | false | true |
| `execute_page_unlock_godmother` | false | false | true |
| `execute_points_godmother` | false | false | true |
| `execute_prize_godmother` | false | false | true |
| `execute_recognition_godmother` | false | false | true |
| `execute_victory_godmother` | false | false | true |
| `execute_widget_data_point_godmother` | false | false | true |

All 15/15 correctly locked to `service_role` only.

**2. End-to-end legitimate flow, live, as an ordinary `authenticated` (non-service-role) session — proves the seat's theoretical safety argument in practice, not just in theory.** Impersonated Tenise (mom, OurFamily) via `SET LOCAL request.jwt.claims` + `SET LOCAL ROLE authenticated` (explicitly NOT `service_role`), then `INSERT INTO deed_firings (...)` directly — the exact operation `fireDeed()` performs client-side for a real task completion — for one of Mosiah's real tasks. Result: Mosiah's `gamification_points` moved **255 → 265** (+10, exactly matching his `base_points_per_task`), proving the full chain (`authenticated` INSERT into `deed_firings` → `trg_deed_firing_dispatch` trigger → `dispatch_godmothers` → `execute_points_godmother` → `record_point_transaction`) completed successfully end-to-end despite every intermediate function now being locked to `service_role`-only EXECUTE. Rolled back; re-verified post-close: balance back to 255, zero residual `deed_firings` row.

**3. Both original exploits re-run against the LOCKED-DOWN functions — now fail at the permission layer, before the function body even executes:**
- `execute_points_godmother` with a fabricated `payload_amount:1000000` deed payload, called as Sarah (Testworth, unrelated family) targeting Helam (OurFamily): `ERROR: 42501: permission denied for function execute_points_godmother`.
- `execute_money_godmother` with a fabricated `payload_amount:5000` deed payload, same attacker/target pair: `ERROR: 42501: permission denied for function execute_money_godmother`.
- Both attempts left zero trace: `helam_points=30` (baseline, unchanged), zero `financial_transactions` rows with the probe's marker description.

**4. `member_points_today` gate — legitimate same-family read succeeds, cross-family read blocked:**
- Tenise (mom, OurFamily) reading Mosiah's (same family) points-today, as `authenticated`: succeeds, returns `0` (the correct real value — Mosiah hasn't earned today in production).
- Sarah (Testworth, unrelated family) attempting to read Mosiah's (OurFamily) points-today, as `authenticated`: `ERROR: P0001: Not authorized`.

### Verdict: **PASS.** All 15 previously-unauthenticated-callable connector functions are now locked to `service_role` only; the legitimate deed-firing pipeline is proven, live, to survive the lockdown unmodified; both originally-exploited functions now fail closed at the permission layer (stronger than an in-body exception — the attacker's payload is never even evaluated); `member_points_today`'s cross-family leak is closed with the same auth-gate pattern used elsewhere, while its legitimate same-family use case continues to work. This closes the CRITICAL/blocking status from the prior section for all 15 functions plus the WARNING on `member_points_today`. Point Economy Slice A2 is now genuinely proof-complete on the security dimension.

**Explicitly out of scope for this migration, per seat direction:** the broader platform-wide question "what OTHER `PUBLIC`-executable `SECURITY DEFINER` RPCs trust caller-supplied input without an auth check?" is NOT addressed here — the seat is folding a full RPC-grant audit into this week's adversarial safety-stack review, separately from PECON-EARN.

---

## Migration 100302 — PECON-SHOP (Worker B): Reward Shop RLS + function-security verification (2026-07-07)

**Overall result: PASS — zero gaps found.** This is the first RLS/function-security pass on brand-new schema (2 tables, 5 functions) rather than a re-verification of a prior finding, and it comes on the heels of two live-exploited CRITICAL findings on this build's sibling (PECON-EARN, migrations 100296/100298/100300 above) — every one of the four client-callable RPCs in this migration (`purchase_reward_shop_item`, `resolve_reward_shop_purchase`, `cancel_reward_shop_purchase`, `member_completion_percentage`) was designed, from the start, with the exact in-body family-membership authorization gate that the sibling build had to retrofit under emergency conditions. All four hold up under live adversarial probing, including a genuinely-unauthenticated (`anon` role, empty `request.jwt.claims`) attack surface that the sibling review did not get to test as rigorously. All probes run via `supabase db query --linked` against the linked production database (project ref `vjfbzpliqialqmabfnxs`) using the same `SET LOCAL ROLE` + `SET LOCAL request.jwt.claims` JWT-claim-impersonation methodology established in this file, batched into 9 separate `BEGIN...ROLLBACK` transactions (one per functional area, plus a follow-up transaction re-testing mom's direct-write access after the initial pass) using a `CREATE TEMP TABLE probe_log` + role-switching capture pattern so multiple role-impersonated sub-tests could be asserted in a single transaction without losing intermediate results. Every mutation probe — INSERT/UPDATE/DELETE attempts, real purchase/approve/decline/cancel round-trips, temporary `member_permissions` grants — was rolled back; a final residue check (below) confirms zero permanent trace and all five involved members' `gamification_points` balances exactly restored to their pre-probe values.

### Test roster

Same two-family roster used throughout this file (OurFamily `4bc86323-545b-4faf-b31f-3926fdd8c5a6`, The Testworth Family `1f6200a7-df82-4ac4-bce3-3edcafe66bc5`), expanded this pass to explicitly exercise **all five platform roles plus both families' shadow (family-device) sessions** — the richest roster used in this file to date:

| Member | Family | Role | dashboard_mode | fm_id | user_id |
|---|---|---|---|---|---|
| Tenise | OurFamily | primary_parent | adult | `fcac562b-b7f2-412b-8e25-33a1e94cc13b` | `7434224b-ebb4-4138-8bd8-9fbc62259c42` |
| Jerrod | OurFamily | additional_adult | adult | `0aea47e9-e6fa-4300-b4a7-6da097c26f9e` | `44a07ad8-94ca-4dd4-84d8-42ae103cf1a6` |
| Helam | OurFamily | member (independent teen) | independent | `b266cf06-d2b4-4c7b-a6bd-559224367005` | `75a9aa25-e980-4ed0-8a75-257fec7f9e8f` |
| Mosiah | OurFamily | member (guided kid) | guided | `476f5e1f-cdd9-4490-8409-59a4440ebd79` | `bfa887d0-a3ad-4c62-bdc7-6eda7dcc25c4` |
| Miriam | OurFamily | member (independent teen) | independent | `3554dacd-f541-4f41-9e3d-815731a671b5` | `280fe726-f6bf-44a4-b844-75728f62991c` |
| Gideon | OurFamily | member (independent teen) | independent | `5aca243a-5f2e-425d-bc25-599d79e83a4f` | `2afba19b-14fd-410e-a716-57bdc3e856ac` |
| Ruthie | OurFamily | member (play kid) | play | `5af76791-f965-4f3d-bf1a-2389bee66e19` | `de48d37a-69fb-49d5-989c-68e66879f3c9` |
| Family (shadow) | OurFamily | family | adult | `c3d31bfa-6ce7-44db-9a0b-5f2a740dde18` | `f8c494bc-eec6-41d0-b8fa-558ac67ae017` |
| Sarah | Testworth | primary_parent | adult | `606aad81-7c59-45af-8770-2df484e4418f` | `81246f0f-ab60-4932-8914-2a48b97b274c` |
| Mark | Testworth | additional_adult | adult | `5f314a51-7c4d-41e3-801d-0aa7e45e54da` | `62d73914-8ff1-44b2-a7f7-92bd586aeb95` |
| Amy | Testworth | special_adult | adult | `008408a7-aefe-43d5-925a-32b0e054c6a0` | `764df3bc-0a13-47c0-877e-d29082105715` |
| Alex | Testworth | member (independent teen) | independent | `a6af8740-cc21-4ebb-8f78-c222dab7310f` | `e159934e-2981-48bf-921d-75931f517cdf` |

Sarah and Jerrod/Helam/etc. have zero relationship — different families, no shared membership, no `member_permissions` grant of any kind — used throughout as the cross-family attacker/victim pair (matching the sibling PECON-EARN methodology).

### Policy inventory

**`reward_shop_items`** (RLS enabled) — 3 permissive policies, combined with OR per Postgres default:

| Policy | Command | Predicate |
|---|---|---|
| `rsi_mom_all` | ALL | `family_id IN (SELECT family_id FROM family_members WHERE user_id=auth.uid() AND role='primary_parent')` |
| `rsi_granted_adult_all` | ALL | `util.has_reward_rules_grant(family_id)` |
| `rsi_member_read` | SELECT | same-family AND `is_active=true` AND `archived_at IS NULL` AND (audience array empty OR caller's fm_id is in it) |

**`reward_shop_purchases`** (RLS enabled) — 1 policy, SELECT only. **No INSERT/UPDATE/DELETE policy exists for any role** — confirmed live, not just read from the migration text (§4 below).

| Policy | Command | Predicate |
|---|---|---|
| `rsp_select` | SELECT | own rows (`family_member_id` matches caller) OR caller is `primary_parent` of the family OR `util.has_reward_rules_grant(family_id)` |

### 1. `reward_shop_items` — full role matrix (11 sub-tests, all PASS)

Setup (as `postgres`, bypasses RLS): 5 OurFamily test items — **A** (open/active/unarchived, empty audience), **B** (active, audience=[Helam] only), **C** (`is_active=false`), **D** (`archived_at` set), **E** (active, audience=[Mosiah] only) — plus 1 Testworth item for cross-family probing.

| # | Role | Action | Expected | Actual | Result |
|---|---|---|---|---|---|
| T1 | Tenise (mom) | SELECT all 5 + INSERT + UPDATE + DELETE | Sees all 5 (incl. inactive C, archived D); full CRUD succeeds; never sees Testworth's item | Sees all 5, `sees_testworth_item=0`, insert/update succeeded, delete left 0 rows | PASS |
| T2a | Jerrod (additional_adult, **no grant**) | SELECT | Same scoping as an ordinary member — sees only A (open/active/unarchived), not B/C/E | `sees_item_A_open=true`, B/C/E all `false`, `total_ourfamily_visible=2` (A + Tenise's inserted item, both open) | PASS |
| T2b | Jerrod (no grant) | INSERT | Blocked — no write policy applies | `42501: new row violates row-level security policy` | PASS — blocked |
| T2c | Jerrod (no grant) | UPDATE item A | Blocked, 0 rows affected | `rows_affected: 0` | PASS — blocked |
| T3 | Jerrod, **after** a family-wide `reward_rules` grant is inserted | SELECT + INSERT + UPDATE | Full CRUD now — sees inactive item C, insert/update succeed | `sees_inactive_item_C_now=1`, insert/update succeeded | PASS |
| T4a | Mosiah (guided kid) | SELECT | Sees A (open) and E (his own audience-scoped item); does not see B (Helam-only) or C (inactive) | `sees_item_A_open=true`, `sees_item_E_mosiah_only=true`, B/C `false` | PASS |
| T4b | Mosiah | INSERT | Blocked | `42501` | PASS — blocked |
| T4c | Mosiah | DELETE item A | Blocked, 0 rows affected | `rows_affected: 0` | PASS — blocked |
| T5a | Sarah (Testworth mom, cross-family) | SELECT | Sees 0 OurFamily items, sees her own Testworth item | `sees_ourfamily_item_A=0`, `sees_own_testworth_item=1` | PASS — no cross-family leakage |
| T5b | Sarah (cross-family) | UPDATE OurFamily item A | Blocked, 0 rows affected | `rows_affected: 0` | PASS — blocked |
| T6 | Mark (Testworth additional_adult, ungranted, cross-family) | SELECT | Sees 0 OurFamily items (even the open one) | `sees_ourfamily_item_A_open=0` | PASS |

### 2. `reward_shop_purchases` — read scoping + write lockdown (10 sub-tests, all PASS)

Setup: 3 OurFamily purchases (Helam/pending, Mosiah/approved, Gideon/declined) + 1 Testworth purchase (Sarah), all inserted as `postgres` (RLS bypassed for setup only — this table has no client INSERT path at all, confirmed below).

| # | Role | Action | Expected | Actual | Result |
|---|---|---|---|---|---|
| P1 | Helam | SELECT | Sees only his own purchase, not Mosiah's or Gideon's | `sees_own_purchase=1`, `sees_mosiah_purchase=0`, `sees_gideon_purchase=0`, `total_visible_ourfamily=1` | PASS |
| P2 | Helam | Direct INSERT (forged `status='approved'`, `points_cost=0`, bypassing the RPC entirely) | Blocked — no INSERT policy exists at all | `42501: new row violates row-level security policy` | PASS — blocked |
| P3 | Helam | Direct UPDATE of his own row's `status` | Blocked, 0 rows affected, even for his own row | `rows_affected: 0` | PASS — blocked |
| P4 | Helam | Direct DELETE of his own row | Blocked, 0 rows affected | `rows_affected: 0` | PASS — blocked |
| P5 | Tenise (mom) | SELECT | Sees all 3 OurFamily purchases, not Testworth's | `total_visible_ourfamily=3`, `sees_testworth_purchase=0` | PASS |
| P6 | Jerrod (ungranted) | SELECT | Sees 0 of the other members' purchases (not his own, no grant, not mom) | `total_visible_ourfamily=0` | PASS |
| P7 | Jerrod, after family-wide `reward_rules` grant | SELECT | Sees all 3 | `total_visible_ourfamily=3` | PASS |
| P8 | Sarah (cross-family) | SELECT | Sees 0 OurFamily purchases, sees her own | `sees_ourfamily_purchases=0`, `sees_own_testworth_purchase=1` | PASS — no cross-family leakage |
| MW1 | **Tenise (mom, primary_parent, same family, has full SELECT visibility)** | Direct `UPDATE ... SET status='approved'` on a real pending purchase, bypassing `resolve_reward_shop_purchase` entirely | Blocked, 0 rows affected — the append-only-except-through-RPC posture holds even for mom, mirroring the `point_transactions` precedent (row 27 in this file) | `rows_affected: 0` | **PASS — mom's read visibility does not extend to direct mutation** |
| MW2 | Tenise (mom) | Direct `DELETE` of the same purchase row | Blocked, 0 rows affected | `rows_affected: 0` | **PASS — blocked even for mom** |

### 3. `purchase_reward_shop_item` — the highest-risk function (16 sub-tests, all PASS)

This is the function that moves real points. Given the sibling build's exact failure mode (a completely absent auth check on `process_routine_step_completion`), every legitimate-vs-illegitimate combination this function's design comment claims to support was live-tested with real balance changes, real ledger rows, and real `earned_prizes` rows — not just exception presence/absence.

| # | Caller | Scenario | Expected | Actual | Result |
|---|---|---|---|---|---|
| R1 | Sarah (Testworth, unrelated family) | Cross-family attack: buy OurFamily's Helam-only item, targeting Helam | Blocked — no relationship to OurFamily | `P0001: Not authorized` | **PASS — BLOCKED** |
| R1b | — | Helam's balance + purchase-row count after the attack | Unchanged (30 pts, 0 new purchase rows) | `points=30`, `purchase_rows_created=0` | PASS — zero side effect from the failed attack |
| R2 | Miriam (own session) | Buys an auto-approve item (cost 5) for herself | Succeeds; balance 75→70; `status=auto_approved` | `balance_after=70`, `status=auto_approved` | PASS |
| R2b | — | Post-purchase state | `earned_prizes` row created; `point_transactions` row created; purchase status = `auto_approved` | `earned_prize_created=1`, `point_txn_created=1`, `points_now=70` | PASS — full real round-trip verified |
| R3 | Helam (own session) | Buys a `requires_approval=true` item (cost 3) for himself | Succeeds; balance 30→27; `status=pending` (points still deducted up-front, per the "deduct now, refund on decline" design) | `balance_after=27`, `status=pending` | PASS |
| R3b | — | Post-purchase state | No `earned_prizes` row yet (correctly deferred until mom resolves) | `earned_prize_created_yet=0` | PASS |
| R4 | Mosiah (guided kid, `role='member'`, not the target) | Buys the auto-approve item **targeting Miriam** (a sibling, not himself; not family-shadow; not an adult role) | Blocked — matches none of the three allowed authorization paths | `P0001: Not authorized` | **PASS — BLOCKED** |
| R5 | Mosiah (own session, valid actor) | Buys the Helam-only item **for himself** | Soft business-logic rejection (not an exception) — `not_in_audience` | `status=not_in_audience`, `error_message: "This item is not available to you."` | PASS |
| R5b | — | Mosiah's balance after the audience rejection | Unchanged (255) | `points=255` | PASS |
| R6 | Gideon (5 pts) | Buys a 999,999-point item for himself | Clean soft failure, no crash, no negative balance | `status=insufficient_balance`, `points_needed=999999` | PASS |
| R6b | — | Gideon's balance after | Unchanged (5) | `points=5` | PASS — no negative-balance corruption |
| R7 | OurFamily **family-shadow session** (`util.is_family_shadow_of`) | Buys the auto-approve item **on behalf of Ruthie** (a `dashboard_mode='play'` kid) | Succeeds (FDWA lesson explicitly wired); balance 11→6 | `balance_after=6` | PASS |
| R7b | — | **Play-always-pends rule**: item has `requires_approval=false`, but Ruthie is `dashboard_mode='play'` | Purchase forced to `status='pending'` regardless of the item's own flag | `status=pending` | **PASS — Play override confirmed live, not just by code-reading** |
| R8 | Tenise (mom) | Buys the auto-approve item **on behalf of Helam** (`p_acted_by` set to her own fm_id) | Succeeds (primary_parent acting-for path); balance 27→22, `auto_approved` | `balance_after=22`, `status=auto_approved` | PASS |
| R9 | Jerrod (additional_adult, **no `reward_rules` grant**) | Buys the auto-approve item **on behalf of Gideon** | Succeeds — acting-for does NOT require the management grant, by design (see Observation A below) | `balance_after=0`, `status=auto_approved` | PASS (documented design, not a gap) |
| R10 | Amy (Testworth `special_adult`) | Buys a Testworth item **on behalf of Alex** (both same family as Amy) | Blocked — `special_adult` is not in the `('primary_parent','additional_adult')` acting-for role list | `P0001: Not authorized` | **PASS — BLOCKED** |
| TA2 | Genuinely anonymous caller (`anon` role, `request.jwt.claims` explicitly cleared — see §8) | Any purchase attempt | Blocked | `P0001: Not authorized` | **PASS — BLOCKED** |

### 4. `resolve_reward_shop_purchase` — mom-only v1 approve/decline (8 sub-tests, all PASS)

| # | Caller | Scenario | Expected | Actual | Result |
|---|---|---|---|---|---|
| S1 | Sarah (cross-family stranger) | Approve a real OurFamily pending purchase | Blocked | `P0001: Not authorized` | **PASS — BLOCKED** |
| S2 | Jerrod (additional_adult, **same family**, no grant) | Approve the same purchase | Blocked — only `primary_parent` may resolve | `P0001: Not authorized` | **PASS — BLOCKED** |
| S3 | Jerrod, **after** a family-wide `reward_rules` grant | Approve the same purchase | **Still blocked** — the management grant does NOT extend to approve/decline authority (v1 ruling 6: mom only) | `P0001: Not authorized` | **PASS — confirms grant scope boundary holds** |
| S4 | Tenise (mom) | Approve a real pending purchase | Succeeds; creates a real `earned_prizes` row | `status=approved`, `prize_id` returned | PASS |
| S5 | Tenise (mom) | Decline a different real pending purchase, with a note | Succeeds; refund transaction created; no `earned_prizes` row | `status=declined` | PASS |
| S6 | Tenise (mom) | Resolve an **already-approved** purchase (idempotency) | Soft return, no double-payout | `status=already_resolved`, `current_status=approved` | PASS |
| S7 | — | Post-state check across S4/S5 | Approve target: 1 prize created, `status=approved`. Decline target: 0 prizes, 1 refund txn, decline note stored verbatim, `status=declined` | All 6 assertions matched exactly | PASS |
| S8 | Amy (Testworth `special_adult`, **same family** as the pending purchase) | Approve it | Blocked | `P0001: Not authorized` | **PASS — BLOCKED** |
| TA3 | Genuinely anonymous caller | Any resolve attempt | Blocked | `P0001: Not authorized` | **PASS — BLOCKED** |

### 5. `cancel_reward_shop_purchase` — kid "Take it back" (7 sub-tests, all PASS)

| # | Caller | Scenario | Expected | Actual | Result |
|---|---|---|---|---|---|
| C1 | Helam (own session) | Cancels his own pending purchase (cost 5) | Succeeds; refund fires; balance 30→35 | `status=cancelled`, `points_now=35`, `refund_txn_created=1` | PASS |
| C2 | Sarah (cross-family stranger) | Cancels Mosiah's (OurFamily) pending purchase | Blocked | `P0001: Not authorized` | **PASS — BLOCKED** |
| C3 | Tenise (mom) | Cancels Gideon's pending purchase (on behalf) | Succeeds | `status=cancelled` | PASS |
| C4 | OurFamily family-shadow session | Cancels Miriam's pending purchase | Succeeds — closes the exact "`redeem_own_prize`'s missing shadow branch" gap the migration's own comment references | `status=cancelled` | PASS |
| C5 | Jerrod (additional_adult, same family, **not** mom, not shadow, not the purchasing member) | Cancels Ruthie's pending purchase | **Blocked** — unlike `purchase_reward_shop_item`'s acting-for rule, `cancel` restricts on-behalf-of to self/shadow/mom ONLY (no additional_adult clause in the code) | `P0001: Not authorized` | **PASS — confirms a real, intentional asymmetry vs. R9 above (see Observation B)** |
| C6 | Helam (own session) | Cancels an **already-cancelled** purchase (idempotency) | Soft return, no double-refund | `status=already_resolved`, `current_status=cancelled` | PASS |
| TA4 | Genuinely anonymous caller | Any cancel attempt | Blocked | `P0001: Not authorized` | **PASS — BLOCKED** |

### 6. `member_completion_percentage` — unlock-gate percentage (4 sub-tests, all PASS)

| # | Caller | Scenario | Expected | Actual | Result |
|---|---|---|---|---|---|
| M1 | Sarah (Testworth, cross-family) | Compute Mosiah's (OurFamily) completion % | Blocked | `P0001: Not authorized` | **PASS — BLOCKED** |
| M2 | Mosiah (own session) | Compute his own completion % | Succeeds, returns a real computed value | `65.8968850698174` | PASS |
| M3 | Tenise (mom, same family) | Compute Mosiah's completion % | Succeeds, same value as M2 (consistent) | `65.8968850698174` | PASS — confirms same-family access is intentionally unrestricted by role (any family member may check any sibling's progress — a read-only, non-sensitive percentage, consistent with the addendum's framing rules) |
| TA1 | Genuinely anonymous caller | Compute any member's completion % | Blocked | `P0001: Not authorized` | **PASS — BLOCKED** |

### 7. `util.has_reward_rules_grant` — grant resolution logic (6 sub-tests, all PASS)

Tested indirectly via its real effect inside the `rsi_granted_adult_all` RLS policy (an inactive "indicator" item only visible through that policy or `rsi_mom_all`), since `authenticated`/`anon` lack `USAGE` on the `util` schema and cannot invoke it via ad-hoc SQL directly (see §8) — this is the same mechanism through which the function is actually exercised in production (from within policy predicates, not direct client RPC calls).

| # | Scenario | Expected | Actual | Result |
|---|---|---|---|---|
| G0 | Direct call as `postgres`, Jerrod ungranted | Returns `false` | `false` | PASS |
| G1 | Jerrod (ungranted) — visibility into the RLS-gated indicator item | Does not see it | `sees_it=0` | PASS |
| G2 | Jerrod, family-wide `reward_rules` grant (`target_member_id IS NULL`, `access_level='manage'`) | Now sees it | `sees_it=1` | PASS |
| G3 | Jerrod, **per-kid-scoped** grant (`target_member_id` set to a real kid) instead of family-wide | Does **NOT** count — the function explicitly requires `target_member_id IS NULL` | `sees_it=0` | **PASS — confirms `reward_rules` is family-wide-only, matching the `studio`/`reward_rules` shape (Convention #274), never the per-kid `financial_tracking` shape** |
| G4 | Jerrod, family-wide grant but `access_level='none'` | Does **NOT** count | `sees_it=0` | PASS — explicit revoke honored |
| — | Sarah (cross-family) checking OurFamily's grant status | Not tested directly (schema-usage blocked — see §8); indirectly proven irrelevant since her own family membership already gates every table policy that calls this function | — | N/A |

### 8. ACL hygiene observation (non-blocking) — implicit `PUBLIC` EXECUTE grant on all 5 new functions

Checked `pg_proc.proacl` for all 5 new functions directly (not inferred): all 4 client-callable functions in the `public` schema (`purchase_reward_shop_item`, `resolve_reward_shop_purchase`, `cancel_reward_shop_purchase`, `member_completion_percentage`) carry an explicit `anon=X/postgres` grant in addition to `authenticated=X/postgres` and `service_role=X/postgres` — this appears to be a project-wide default privilege behavior for new functions created in the `public` schema (not something this migration's `GRANT ... TO authenticated, service_role` statements introduced on their own — Postgres/Supabase's default privilege configuration for this project evidently auto-grants `EXECUTE` on new `public`-schema functions to `anon` as well). `util.has_reward_rules_grant` shows no explicit `anon=` entry (its `REVOKE ALL ... FROM anon` succeeded in removing that), but still carries the implicit `=X/postgres` (`PUBLIC`) entry from function creation, meaning `anon` still inherits `EXECUTE` via `PUBLIC` membership regardless of the explicit per-role revoke — a well-known Postgres nuance (revoking from a named role has no effect on privileges the role inherits from `PUBLIC`).

**This was not left as a theoretical concern — it was empirically tested with a genuinely-anonymous call (§3 TA2, §4 TA3, §5 TA4, §6 TA1), correcting an initial test-methodology mistake:** the first attempt to simulate "truly anonymous" used `SET LOCAL ROLE anon` without also clearing the `request.jwt.claims` session GUC, which — because `SET LOCAL` variables persist for the remainder of a transaction independent of `RESET ROLE` — left Tenise's `sub` claim from an earlier impersonation still active, causing `member_completion_percentage` to appear to succeed for "anon" (a false positive caused by test setup, not a real gap). Re-run with `SET LOCAL request.jwt.claims TO '';` explicitly clearing the GUC before `SET LOCAL ROLE anon`, all four functions correctly raised `Not authorized` — confirming the implicit `PUBLIC`/`anon` `EXECUTE` grant does not translate into an exploitable bypass, because every one of the four functions independently checks `auth.uid() IS NOT NULL` before attempting any authorization resolution, and defaults to `v_authorized := FALSE` (raising the exception) when it is not. `util.has_reward_rules_grant` is additionally protected by a second layer: neither `authenticated` nor `anon` holds `USAGE` on the `util` schema, so an ad-hoc client call to it fails at parse time (`42501: permission denied for schema util`) before the function-level `EXECUTE` grant is even reached — a stronger posture than the four `public`-schema functions.

**Verdict on this finding: WARNING, not blocking** — matches the exact severity classification already established in this file for `member_points_today` (pre-100300-fix), `calculate_running_balance`, and `family_today`: an ACL hygiene gap (the implicit `PUBLIC` grant should ideally be explicitly revoked, e.g. `REVOKE ALL ON FUNCTION ... FROM PUBLIC` before the intended `GRANT ... TO authenticated, service_role`), but with zero practical exploitability because every function's own body independently fails closed for a truly-unauthenticated caller. This is a materially different situation from the `execute_*_godmother` CRITICAL findings in migrations 100296/100298 — those functions had **no authorization check of any kind**, trusting caller-supplied JSON outright; these four functions were built, from the start, with the correct family-membership gate this build's sibling had to retrofit under emergency conditions. Recommend folding this into the same future least-privilege hardening pass already flagged in this file (`REVOKE ALL ... FROM PUBLIC` + re-`GRANT` explicitly to `authenticated, service_role` on these 4 functions, mirroring what `util.has_reward_rules_grant` should also receive) — optional hygiene, not a pre-beta blocker.

### 9. Residue check — zero permanent trace across all 9 probe transactions

```sql
SELECT
  (SELECT COUNT(*) FROM reward_shop_items WHERE name LIKE 'RLSPROBE%')          AS items_residue,        -- 0
  (SELECT COUNT(*) FROM reward_shop_purchases WHERE item_name LIKE 'RLSPROBE%') AS purchases_residue,    -- 0
  (SELECT COUNT(*) FROM point_transactions WHERE source_type IN ('store_purchase','store_refund')) AS pt_from_probes, -- 0
  (SELECT COUNT(*) FROM earned_prizes WHERE source_type='store_purchase')      AS prizes_residue,        -- 0
  (SELECT COUNT(*) FROM financial_transactions WHERE description LIKE '%RLSPROBE%') AS ft_residue,        -- 0
  (SELECT COUNT(*) FROM member_permissions WHERE permission_key='reward_rules') AS grants_residue,        -- 0
  (SELECT COUNT(*) FROM notifications WHERE source_type='reward_shop_purchase') AS notif_residue;         -- 0
```

All zero. Every probed member's `gamification_points` confirmed back to its exact pre-probe baseline: Helam 30, Mosiah 255, Miriam 75, Gideon 5, OurFamily-Ruthie 11.

### Observations (design confirmations, not gaps)

- **Observation A (R9):** an `additional_adult` **without** a `reward_rules` management grant can still call `purchase_reward_shop_item` on behalf of any kid in the family — the acting-for path checks `role IN ('primary_parent','additional_adult')` only, independent of the catalog-management grant. This is explicitly documented in the migration's own header comment ("a parent/adult acting-for") and is architecturally consistent: managing the *catalog* (creating/pricing items) requires the grant; helping a kid *check out* an item mom already priced does not, since every purchase still routes through the same balance/audience/limit/unlock checks and, for `requires_approval=true` items, still parks for mom's own approval. Confirmed intentional, not flagged as a gap — but worth the founder's explicit awareness that this is broader than the catalog-management boundary.
- **Observation B (C5 vs. R9):** `cancel_reward_shop_purchase` does **not** extend the same acting-for privilege to `additional_adult` — only the purchasing member's own session, a family-shadow session, or `primary_parent` may cancel a pending purchase on someone else's behalf. This creates a real, live-confirmed asymmetry (an ungranted dad can help a kid buy something, but cannot take it back on the kid's behalf) — consistent with the code as written, not a bug, but worth a design-intent confirmation from the founder since the two "acting-for" surfaces don't mirror each other.
- **Play-always-pends (R7b)** is enforced correctly at the function level regardless of the item's own `requires_approval` flag — verified live, not just by code inspection.
- **Grant-scope boundary (S3)** is airtight: a `reward_rules` grant expands catalog CRUD and purchase visibility, but never approve/decline authority, which remains `primary_parent`-only in this v1 (ruling 6).

### Summary

| Item | Verdict |
|---|---|
| `reward_shop_items` RLS (mom/granted-adult full CRUD; kid/ungranted-adult scoped read, no write; cross-family isolation) | **PASS** — 11/11 sub-tests |
| `reward_shop_purchases` RLS (own-only read; mom/granted-adult full read; zero write policies for any role — including mom herself) | **PASS** — 10/10 sub-tests |
| `purchase_reward_shop_item` (cross-family block, own-session success, kid-for-sibling block, audience scoping, insufficient balance, family-shadow, acting-for, special_adult block, Play-always-pends, truly-anon block) | **PASS** — 16/16 sub-tests, zero exploit found |
| `resolve_reward_shop_purchase` (mom-only v1, grant does not bypass, real approve/decline round-trip, idempotency, special_adult block, truly-anon block) | **PASS** — 8/8 sub-tests |
| `cancel_reward_shop_purchase` (self/mom/shadow succeed, stranger blocked, additional_adult blocked, idempotency, truly-anon block) | **PASS** — 7/7 sub-tests |
| `member_completion_percentage` (cross-family block, same-family unrestricted, truly-anon block) | **PASS** — 4/4 sub-tests |
| `util.has_reward_rules_grant` (family-wide-only resolution, per-kid excluded, `none` excluded, schema-usage-blocked for direct client calls) | **PASS** — 6/6 sub-tests |
| Implicit `PUBLIC`/`anon` `EXECUTE` grant on all 5 functions | **WARNING, non-blocking** — empirically confirmed unexploitable; recommend folding into the platform-wide least-privilege sweep already flagged in this file |
| Residue after all 9 probe transactions | **Zero** — every table, every balance, exactly restored |

**Verdict: PASS.** No CRITICAL or ERROR findings. Every mutation path on both new tables is correctly locked to its intended role; all four client-callable RPCs correctly gate on family membership (or the specific narrower rule each is designed around — mom-only for resolve, self/shadow/mom for cancel, self/shadow/adult for purchase) *before* computing or paying anything, including against a genuinely-unauthenticated caller; the one hygiene gap found (implicit `PUBLIC` EXECUTE grant) does not translate into a working exploit and is recommended for the same future platform-wide least-privilege pass already on file, not a blocker for this build.
