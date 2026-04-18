# Class D Privacy Wraps Backlog — archive_context_items SELECT sites

> **Status:** Backlog. Not a bug list.
> **Source:** S3 Task 4 pre-push audit (commit `a11a456`), Phase 0.26
> **Last reviewed:** 2026-04-18 (Phase 0.26 S5)

## Purpose

During the Phase 0.26 S3 Task 4 pre-push audit, 38 references to `archive_context_items` across the codebase were classified into five categories:

| Class | Count | Description |
|---|---|---|
| A | 4 | Sites fixed in S3 — wrapped with `applyPrivacyFilter` in the same push |
| B | 11 | Writes (INSERT/UPDATE/DELETE) — out of scope for SELECT privacy filtering |
| C | 1 | Pre-fixed read — already had role-asymmetric inline filter (`context-assembly.ts:218-228`) |
| **D** | **12** | **Reads tightened by RLS — this file's scope** |
| Non-query | 10 | Comments, string literals, type definitions |

**Class D sites work correctly today.** The RLS policy from migration `00000000100149_archive_context_items_privacy_rls.sql` enforces `is_privacy_filtered = false` at the database layer for non-mom users. The 12 sites below rely on that policy instead of wrapping their client-side reads with the `applyPrivacyFilter` helper.

This backlog captures them as candidates for future migration to explicit app-layer wrapping. Migration is an **intention-clarity improvement, not a correctness fix** — nothing is broken today.

## Benefits of migrating to app-layer wraps

1. **Intention clarity** — reading the code locally shows the privacy contract without requiring knowledge of the RLS policy. The guarantee becomes visible at the call site instead of inferable from a migration file.
2. **Regression defense** — if the RLS policy is ever removed, modified, or bypassed (service-role Edge Functions, for example), app-layer wraps continue to enforce correctness.
3. **Convention #76 compliance** — the grep-based CI check for `archive_context_items` references lacking a nearby `is_privacy_filtered` filter will stop flagging these as findings once wrapped.

## Status legend

- `[PENDING]` — site still reads `archive_context_items` without an app-layer wrap. RLS is carrying the correctness load.
- `[WRAPPED]` — site now uses `applyPrivacyFilter` or an equivalent inline role-asymmetric filter.
- `[DEFERRED]` — site reviewed and intentionally left on RLS-only protection (with rationale in Notes).

## The 12 sites

| # | Status | File:Line | Description | Consumer | Impact for non-mom user |
|---|---|---|---|---|---|
| 1 | [PENDING] | `src/hooks/useArchives.ts:177` | SELECT items by `folder_id` (folder detail view) | Archives page UI | Non-mom browsing a folder with privacy-filtered items gets them excluded by RLS — intended behavior |
| 2 | [PENDING] | `src/hooks/useArchives.ts:197` | SELECT items by `family_id` | Archives page | Same as #1 — RLS excludes privacy-filtered items for non-mom |
| 3 | [PENDING] | `src/hooks/useArchives.ts:445` | COUNT items per member (member card widget) | Archives overview | Non-mom counts drop slightly — cosmetic tightening, non-functional impact |
| 4 | [PENDING] | `src/hooks/useArchives.ts:758` | SELECT items (data export loop) | Export feature | Non-mom exports won't include privacy-filtered items — intended behavior |
| 5 | [PENDING] | `src/hooks/useArchives.ts:811` | SELECT items (export) | Export feature | Same as #4 — intended behavior |
| 6 | [PENDING] | `src/hooks/useArchives.ts:898` | SELECT folder detail items | Archives folder view | Non-mom folder view drops privacy-filtered items — intended behavior |
| 7 | [PENDING] | `src/pages/InnerWorkings.tsx:1064` | SELECT Mom's Observations | Mom-only feature (explicit inline comment at line 1045 states mom-only scope) | None — mom passes `is_primary_parent_of()` check in RLS; feature is already scoped to her |
| 8 | [PENDING] | `src/lib/ai/context-assembly.ts:274` | SELECT family-overview items (no `member_id` filter) | LiLa context assembly (browser-side) | Family-overview items with `is_privacy_filtered=true` drop for non-mom — intended behavior |
| 9 | [PENDING] | `src/pages/archives/ArchivesPage.tsx:85` | COUNT query | Archives page counts | Cosmetic count tightening |
| 10 | [PENDING] | `src/pages/archives/ArchivesPage.tsx:158` | COUNT query | Archives page counts | Cosmetic count tightening |
| 11 | [PENDING] | `src/pages/archives/ArchivesPage.tsx:164` | COUNT query | Archives page counts | Cosmetic count tightening |
| 12 | [PENDING] | `src/pages/archives/ArchivesPage.tsx:212` | COUNT query | Archives page counts | Cosmetic count tightening |

## Resolution tracking

As sites are wrapped (or intentionally deferred), flip the Status column from `[PENDING]` to `[WRAPPED]` or `[DEFERRED]`. When all 12 are resolved, archive this file under `.claude/backlogs/archive/` or delete it — the STUB_REGISTRY pattern. Add a Notes column inline for any `[DEFERRED]` row to record the rationale.

### Drift note

This list was accurate as of the S3 pre-push audit (`a11a456`, 2026-04-17). Before taking action on any row, re-run:

```bash
mgrep search "archive_context_items" --max 50
```

and inspect each hit for nearby `applyPrivacyFilter` wrapping or inline `if (!isMom)` logic (the Class C #1 pattern at `src/lib/ai/context-assembly.ts:218-228`). Any site that has been wrapped since the audit can be marked `[WRAPPED]` without a new code change.

## Cross-references

- **Audit source:** S3 Task 4 pre-push audit, commit `a11a456`
- **RLS policy:** `supabase/migrations/00000000100149_archive_context_items_privacy_rls.sql`
- **Convention #76** in `CLAUDE.md` — "Privacy Filtered is a HARD system constraint" (defines the ground rule this backlog serves)
- **Helper:** `applyPrivacyFilter()` in `supabase/functions/_shared/privacy-filter.ts`
- **Companion helper:** `isPrimaryParent()` in the same file (see Convention #245)
