# Testworth Consolidation — 2026-04-18

> Historical record of the duplicate-Testworth-family cleanup executed on 2026-04-18.
> Standalone session triggered by an accidental S4-prep discovery of 5 production families.

## Problem statement

Pre-S4 reconnaissance on 2026-04-18 revealed the production Supabase instance
(`vjfbzpliqialqmabfnxs.supabase.co`) contained **5 families** instead of the expected 3:

| created_at | family_id | family_name | login | members |
|---|---|---|---|---|
| 2026-03-23 | `4bc86323…` | OurFamily | WarmthWisdomWork | 9 |
| 2026-03-25 | `7db17360…` | **The Testworths** (duplicate) | testworths | 7 |
| 2026-03-26 | `1f6200a7…` | The Testworth Family (canonical) | testworthfamily | 8 |
| 2026-03-26 | `cccf754c…` | Bridgette's Family | (null) | 1 |
| 2026-04-03 | `74f95b54…` | **Mom's Family** (placeholder) | (null) | 1 |

Two families needed deletion:
- **`7db17360…`** — duplicate "The Testworths", previously auto-seeded by the now-deleted
  `tests/e2e/helpers/seed-family.ts`. `@myaim.test` auth users (7). Actively used by Playwright
  CI runs (1,480 rows of test artifacts accumulated), but conceptually redundant with the
  canonical family.
- **`74f95b54…`** — Mom's Family placeholder with a `mosiah@placeholder.local` auth account.
  Confirmed as dev artifact by founder. 33 rows total.

The canonical **`1f6200a7…`** ("The Testworth Family" / `testworthfamily`) is the richer
fixture — Ruthie with Down syndrome representation, member avatars, founder's personality-test
self_knowledge on Sarah and Mark, 149 archive_context_items. This was preserved unchanged.

## Approach

Six-commit sequence executed as a standalone session between Phase 0.26 S6 and the
deferred S4 Wizard multi-user Playwright work.

| # | Sha | Scope |
|---|---|---|
| 1 | `b57ffb0` | Make `seed-testworths-complete.ts` importable: extract `seedTestworthFamily()`, export `TEST_USERS` + `TEST_IDS` with new roster keys, keep CLI entry via basename guard |
| 2 | `b0a149b` | Rewire 12 consumer files (auth helper + 11 spec files) to import from the unified seed. Redirect `loginAsMom/Dad/Grandma/Riley` internals to `TEST_USERS.sarah/mark/amy/ruthie` (function names preserved → zero caller-site changes across 52 files) |
| 3 | `8076ec8` | Delete `seed-family.ts` (428 lines). Rewire `global-setup.ts` to call `seedTestworthFamily()`. Local `.auth/*.json` cache wiped |
| 4 | — | Production DELETE execution (no git commit; DB-only operation) |
| 5 | `2d34a68` | Refresh `claude/live_schema.md` against the 3-family production state |
| 6 | `<this>`  | This backlog doc |

## Commit 4 — production cleanup detail

### Pre-flight recon (5 tasks)

1. **pg_constraint FK audit** for `families(id)` — 120 FKs: 90 CASCADE, 30 NO ACTION,
   0 RESTRICT, 0 SET NULL. Catalog stored in `test-results/recon-task1-fk-audit.sql`.
2. **Count-only dry run** per family-scoped table per target family. Orphan: 1,480 rows
   across 45 non-empty tables. Mom's Family: 33 rows across 10 non-empty tables.
3. **Auth enumeration** — 7 `@myaim.test` accounts (confirmed from Phase 1 recon) +
   1 `mosiah@placeholder.local`. Total 8 users to delete.
4. **Cross-family dependency check** — ran outward + inward FK checks across 23 member-FK
   columns. **Zero cross-family references.** Both target families fully self-contained.
5. **Storage bucket references** — avatars, bookshelf storage_path, journal audio,
   task/victory images: **zero storage artifacts** to clean up on either target family.

### First execution attempt — partial failure

Step 1.1 cleared 345 NO ACTION rows across 8 tables cleanly
(meeting_agenda_items=29, meeting_template_sections=6, meeting_templates=3,
bookshelf_items=150, bookshelf_collections=1, dashboard_widgets=114,
financial_transactions=2, intention_iterations=40).

Step 1.2 (`DELETE FROM families WHERE id = orphan`) **FAILED** with:
```
update or delete on table "family_members" violates foreign key constraint
"task_assignments_assigned_by_fkey" on table "task_assignments"
```

Root cause: Task 1 audited only FKs to `families(id)`. It missed **second-level FKs**
pointing at `family_members(id)`. Postgres cascade ordering processes `family_members`
deletion before sibling cascades complete; any NO ACTION FK to `family_members` from
a table whose rows still exist at that moment blocks the cascade.

### Second-level audit (Step 1.1b)

Queried `pg_constraint` for all FKs to `family_members(id)`. Results:
- CASCADE: ~90 (self-clean)
- **NO ACTION: 79** (potential blockers)
- **RESTRICT: 4** (potential blockers)
- SET NULL: 9 (safe — FK nulls on delete; row survives)

Cross-referencing the 83 NO-ACTION/RESTRICT FK sources against current orphan-member
references produced **14 non-empty FK sources** across 8 tables totaling **173 rows**
requiring explicit cleanup before the family DELETE could succeed.

### Step 1.1b cleanup sequence

| # | Table | Columns cleared | Rows |
|---|---|---|---:|
| 1 | task_assignments | member_id, assigned_by, family_member_id (NO ACTION) | 17 |
| 2 | task_completions | approved_by, family_member_id, acted_by, member_id (NO ACTION) | 3 |
| 3 | tasks | family_id = ORPHAN | 105 |
| 4 | list_shares | shared_with, member_id (NO ACTION) | 1 |
| 5 | lists | family_id = ORPHAN | 24 |
| 6 | conversation_threads | started_by (RESTRICT) | 3 |
| 7 | conversation_spaces | family_id = ORPHAN | 9 |
| 8 | family_requests | family_id = ORPHAN | 11 |

**Step 1.1b total: 173 rows.** Post-cleanup audit confirmed all 14 FK sources returned
to zero. Step 1.2 retry succeeded cleanly — no further iteration needed (no third-level
blockers surfaced).

### Step 2 — Mom's Family

Single `DELETE FROM families WHERE id = '74f95b54…'`. All 33 rows cascade-cleaned
via the standard CASCADE chain. No NO ACTION blockers.

### Step 3 — Auth cleanup

Eight sequential `supabase.auth.admin.deleteUser()` calls. 8/8 succeeded.
- `testmom@myaim.test`, `testdad@myaim.test`, `testgrandma@myaim.test`
- `testalex@myaim.test`, `testcasey@myaim.test`, `testjordan@myaim.test`, `testriley@myaim.test`
- `mosiah@placeholder.local`

### Step 4 — Final verification

- Remaining families: **3** (OurFamily, Testworth Family, Bridgette's Family) ✓
- Family members referencing deleted families: **0** ✓
- Remaining `@myaim.test` / `mosiah@placeholder.local` auth users: **0** ✓
- Canonical preservation: 8 members, 149 archive_context_items — **unchanged** ✓

## Totals

- Rows deleted: **~1,521** across ~50 tables
  (Step 1.1: 345 + Step 1.1b: 173 + orphan family cascade: ~1,003 + Mom's Family cascade: 34 − overlap)
- Families deleted: **2**
- Auth users deleted: **8**
- Storage objects touched: **0**

## Code-side changes

### Files deleted
- `tests/e2e/helpers/seed-family.ts` (428 lines)

### Files modified (12 total, Commit 2)
- `tests/e2e/helpers/auth.ts` — import swap + 4 login functions' internals redirected
- `tests/e2e/helpers/global-setup.ts` (Commit 3) — rewired to unified seed
- `tests/e2e/demo/testworth-smoke.spec.ts` — password fix
- `tests/e2e/features/linked-steps-mastery.spec.ts` — `TEST_USERS.mom` → `.sarah`
- `tests/e2e/features/list-victory-mode.spec.ts` — `.mom` → `.sarah`, `.dad` → `.mark`
- `tests/e2e/features/opportunity-list-unification.spec.ts` — hardcoded creds updated
- `tests/e2e/features/prd28-allowance-financial.spec.ts` — hardcoded creds updated
- `tests/e2e/features/prd28-homework-tracking.spec.ts` — hardcoded creds updated
- `tests/e2e/features/queue-dad-teen-e2e.spec.ts` — TEST_IDS dead import removed,
  `family_login_name 'testworths' → 'testworthfamily'`, `byName('Test Mom') → 'Sarah'`,
  `byName('Test Dad') → 'Mark'`
- `tests/e2e/features/reference-list.spec.ts` — `.mom` → `.sarah`
- `tests/e2e/features/studio-intelligence-phase1.spec.ts` — `.mom` → `.sarah`
- `tests/e2e/features/translator.spec.ts` — `TEST_IDS.momMemberId` → `.sarahMemberId`
- `tests/e2e/features/universal-list-wizard.spec.ts` — `.mom` → `.sarah`

### Files regenerated
- `claude/live_schema.md` — refreshed via `npm run schema:dump`

## Seed canonical state

The canonical Testworth family is now the single source of truth for all Playwright runs:
- family_id: `1f6200a7-df82-4ac4-bce3-3edcafe66bc5`
- family_login_name: `testworthfamily`
- Password: `Demo2026!`
- Members (8): Sarah (mom), Mark (dad), Alex (15 teen), Casey (14 teen), Jordan (10 guided),
  Ruthie (7 play, Down syndrome representation), Amy (special_adult), Kylie (special_adult)
- All members have avatars in the `family-avatars` storage bucket under the family id path
- Archive context: 149 items covering all 8 members + family overview
- Self-knowledge: 98 entries including founder's personality-test data on Sarah and Mark

## Lessons learned

**FK audit depth:** auditing FKs to the direct parent table (`families(id)`) is
insufficient when child tables (`family_members(id)`) have their own no-cascade FKs
from third parties. For any future "delete a family" operation, the audit must cover
at least:
- FKs pointing at `families(id)`
- FKs pointing at `family_members(id)` where `family_members.family_id = target_family`
- Potentially third-level FKs to tables like `tasks`, `lists`, `conversations` if
  those cascade chains have their own no-cascade downstream FKs

**Cascade ordering is not reliable.** Don't assume Postgres will cascade-delete
child-of-child rows before processing parent cascade checks. Explicitly clear every
row that could block via NO ACTION FK, scoped by the target family or its members,
before the top-level DELETE fires.

**Iterative cleanup is cheap when audits are good.** The first failure pointed at
one specific blocker (task_assignments.assigned_by); the comprehensive audit that
followed covered every other FK to family_members in a single pass, avoiding the
slower path of iterative trial-and-error per FK.

**Defensive scripts stay safe through partial execution.** The mid-sequence failure
left the orphan in a partial-clean state. Safety was preserved because:
- Every DELETE was explicitly scoped to a target family_id constant
- Canonical/Wertman/Bridgette's data was never referenced by any DELETE query
- Preflight in the continuation script re-verified canonical state before resuming

## References

- `test-results/recon-task1-fk-audit.sql` — Task 1 query
- `test-results/recon-task1b-fk-members.sql` — Task 1b second-level audit
- `test-results/recon-commit4.ts` — Tasks 2-5 reconnaissance
- `test-results/recon-step1b-audit.ts` — Step 1.1b pre-execution audit
- `test-results/execute-commit4.ts` — First execution attempt (halted)
- `test-results/execute-commit4-continue.ts` — Successful continuation
- `test-results/recon-families.ts` — Initial 5-family discovery
- `test-results/recon-families-scope.ts` — Query B/C (Mom's Family + Bridgette's)
- `test-results/recon-testworth-consolidation.ts` — Phase 1 full recon

All `test-results/*` artifacts are gitignored local-only; recreate from the backlog
doc if the scripts need to be rerun for any reason.
