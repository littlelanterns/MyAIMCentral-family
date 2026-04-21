---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-21
Addendum: prds/addenda/PRD-21C-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-21C (source) ↔ PRD-21A (engagement overlays on cards + detail view + schema additions to vault_items), PRD-21B (Moderation tab wiring + engagement analytics), PRD-21 (lila_tool_permissions.saved_prompt_id), PRD-11 (Vault completion → Victory external source), PRD-15 (comment_reply notification type), PRD-05 (Haiku comment moderation use case + LiLa proactive suggestion enrichment), PRD-22 (engagement notification preferences)
Provenance: Worker `aabd5adf7f6bb659c` (Opus, report-only mode) ran in-memory evidence pass across: full PRD-21C-Cross-PRD-Impact-Addendum.md (212 lines), full PRD-21C-AI-Vault-Engagement-Community.md (1033 lines), migration 00000000100039_vault_tables.sql (heart_count/comment_count/satisfaction_positive/satisfaction_negative pre-seeded at lines 108-111; saved_prompt_id column added at lines 469-474; shared_with_member_id at line 413), migration 00000000000002_permissions_access_control.sql (moderation_admin enum value at line 48), live_schema.md (lines 2248-2270 confirm all 6 engagement tables absent), src/features/vault/hooks/useVaultBrowse.ts (lines 54-56 type heart_count + comment_count with `// Engagement (PRD-21C future)` comment), grep across src/ and supabase/functions/ for engagement tables + moderation tokens (zero hits). Cross-referenced sibling EVIDENCE_prd21a-cross-prd-impact.md surprises and EVIDENCE_prd21-cross-prd-impact.md.
---

## Worker cover paragraph

Scope of this addendum's traversal: PRD-21C Cross-PRD Impact Addendum describes how AI Vault Engagement & Community integrates with 7 existing PRDs (PRD-21A engagement overlays + schema counters, PRD-21B Moderation tab + analytics, PRD-21 `saved_prompt_id`, PRD-11 Victory suggestion, PRD-15 comment_reply notification, PRD-05 Haiku moderation use case, PRD-22 engagement notification prefs) plus a Build Order note. Worker read the full Cross-PRD addendum (212 lines), the full PRD-21C base spec (1033 lines), migration 100039 (where four denormalized counters and two FK columns were *pre-seeded* for future PRD-21C work), the permissions migration 000002 (which already reserves `moderation_admin` in the `staff_permissions.permission_type` enum), `useVaultBrowse.ts` (which types `heart_count` and `comment_count` on VaultItem with a literal `// Engagement (PRD-21C future)` comment), and grepped broadly across src/ + supabase/functions/ + migrations for the six engagement tables and any moderation pipeline. The verdict is unusually clean: **PRD-21C is a Stub-or-Deferred surface from end to end.** Zero of the six tables exist in the live database (confirmed by live_schema.md lines 2248-2270 each reading "listed in DOMAIN_ORDER but not present in the live database"), zero Edge Functions handle moderation, zero UI code reads or writes engagement data, and no Admin Moderation page has been scaffolded. The only "integration artifacts" that exist are (a) four zeros-forever counter columns on `vault_items` that were added when migration 100039 ran, (b) the `saved_prompt_id` column on `lila_tool_permissions` and `shared_with_member_id` on `user_saved_prompts` added in the same migration, and (c) the `moderation_admin` enum value in permission_type — all of which exist as structural placeholders with no consumer code.

The defining surprise is not a wiring defect; it is a **documentation defect across the Vault integration envelope**. The PRD-21A Cross-PRD Impact Addendum describes engagement indicators on cards (heart count, viewed indicator, progress bar, filled heart state) as if they are the obvious next integration, and `useVaultBrowse` types both counters ready-for-use. But PRD-21A's Seam 6 already notes the lock/tier badge stub (`isLocked = false` hardcoded) — and PRD-21C's entire surface is a deeper version of the same pattern: schema plumbing present, server absent, client placeholder. The addendum's "Build Order Source of Truth" note at line 196 claims "PRD-21C completed (Wave 2, item 5)" and "6 new tables" are added — but those tables are NOT in the live database. Either the addendum asserts a completion that never happened, or the migration for PRD-21C's six tables was written-but-never-applied. I could find no migration file that creates them — they are genuinely unbuilt, not missing-from-production.

A second surprise: the Haiku comment moderation gate (the only Scope 8b-adjacent surface in this addendum) has no sibling pattern in the codebase. The blog content moderation Edge Function cited in `claude/architecture.md` (`blog-comment-moderate`) also does not exist on disk — the functions directory has no such file, and grep across supabase/ returns zero hits for "blog-comment-moderate" or any comment-moderation Edge Function. The pattern prescribed in PRD-21C Section §AI Integration (Haiku gate, `approve/flag/reject` response, `vault_moderation_log` write, rephrasing suggestion to user) has no reference implementation anywhere in the repo. When PRD-21C is eventually built, this moderation pipeline will be a fresh code path, not a reuse.

A third surprise — the one that might matter to the audit: **PRD-21A's SCOPE-3.F-A (the renamed `is_enabled`/dropped `granted_by` silent-failure on MemberAssignmentModal) is a blocker for PRD-21C's share-to-Toolbox pipeline too.** PRD-21C Screen 4 "Share Action Sheet" (lines 238-260) prescribes "+ Add to Family Member's Toolbox" and "Share from My Prompts" — both of which write to `lila_tool_permissions`. Once PRD-21C is built, the saved-prompt sharing path will inherit the same write failure PRD-21A Seam 1 already documents. The inherited risk is worth noting cross-finding.

## Per-seam two-column table

| # | Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|---|
| 1 | Denormalized counters `heart_count`, `comment_count`, `satisfaction_positive`, `satisfaction_negative` on `vault_items`, maintained by DB trigger | Addendum lines 47-58, PRD-21C lines 686-691 | Migration 00000000100039_vault_tables.sql:108-111 adds all four columns with `NOT NULL DEFAULT 0`. **Zero triggers exist** that update them — the source tables don't exist, so there is nothing to trigger ON. `useVaultBrowse.ts:55-56` reads `heart_count` and `comment_count` on VaultItem and they will forever be `0`. Counter columns are placeholder data. | Deferred-Document | SCOPE-3.F (low; declared dependency is unbuilt) | N |
| 2 | `vault_engagement` table (hearts) | Addendum line 197 + PRD-21C lines 555-572 | **Not in live schema** (live_schema.md:2248-2250). No migration creates it. No code reads from it. | Deferred-Document | SCOPE-3.F (low) | N |
| 3 | `vault_comments` table (threaded discussions, max depth 3, mom-only) | Addendum line 197 + PRD-21C lines 574-599 | **Not in live schema** (live_schema.md:2252-2254). No migration, no code. | Deferred-Document | SCOPE-3.F (low) | N |
| 4 | `vault_comment_reports` table (community reports, auto-hide threshold) | Addendum line 197 + PRD-21C lines 601-617 | **Not in live schema** (live_schema.md:2256-2258). No migration, no code. | Deferred-Document | SCOPE-3.F (low) | N |
| 5 | `vault_moderation_log` table (audit trail for auto + manual moderation) | Addendum line 197 + PRD-21C lines 619-640 | **Not in live schema** (live_schema.md:2260-2262). No migration, no code. | Deferred-Document | SCOPE-3.F (low) | N |
| 6 | `vault_satisfaction_signals` table (binary thumbs up/down, admin-only) | Addendum line 197 + PRD-21C lines 642-657 | **Not in live schema** (live_schema.md:2264-2266). No migration, no code. | Deferred-Document | SCOPE-3.F (low) | N |
| 7 | `vault_engagement_config` table (KV store for thresholds + topic exclusions) | Addendum line 197 + PRD-21C lines 659-680 | **Not in live schema** (live_schema.md:2268-2270). No migration, no code. | Deferred-Document | SCOPE-3.F (low) | N |
| 8 | `user_saved_prompts.shared_with_member_id` column | Addendum lines 61-67 + PRD-21C lines 693-699 | Migration 00000000100039_vault_tables.sql:413 adds `shared_with_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL`. Column is in live_schema.md line 1991. **Zero readers, zero writers across src/ and supabase/functions/** (grep returns no matches). Dead data. | Deferred-Document | SCOPE-3.F (low; plumbing placeholder) | N |
| 9 | `lila_tool_permissions.saved_prompt_id` column + Toolbox render-time fallthrough (saved_prompt_id → user_saved_prompts, else → vault_item_id) | Addendum lines 113-122 + PRD-21C lines 701-707 | Migration 100039:469-474 adds the column with FK "deferred". Live_schema.md line 367 confirms it. **No code checks or reads this column** — grep for `saved_prompt_id` across src/ returns zero hits. Toolbox rendering has no branch for saved-prompt content. | Deferred-Document | SCOPE-3.F (low; plumbing placeholder) | N |
| 10 | Comment moderation gate — Haiku Edge Function with `approve/flag/reject` response contract | Addendum lines 155-163 + PRD-21C lines 735-791 | No Edge Function exists. Grep across supabase/functions/ for "moderate", "moderation", "comment" returns zero matches. The sibling `blog-comment-moderate` referenced in architecture.md also does not exist on disk. | Deferred-Document | SCOPE-3.F + **SCOPE-8b cross-ref** (moderation pipeline is a child-data-adjacent safety surface when built — but absent today) | N |
| 11 | Victory Recorder auto-suggest on Vault completion | Addendum lines 126-137 + PRD-21C lines 793-803 | No completion → victory path exists. Grep for "vault_completion" or "progress_status.*completed" in Victory code returns no matches. Completely unwired. | Deferred-Document | SCOPE-3.F (low) | N |
| 12 | `comment_reply` notification type in PRD-15 registry | Addendum lines 141-150 + PRD-21C lines 794, 1025 | PRD-15 (Messaging) scope was closed with notification framework partially wired. `comment_reply` is not in the notification_type CHECK or code. No notifications table readers/writers for Vault replies. | Deferred-Document | SCOPE-3.F (low) | N |
| 13 | LiLa context enrichment with engagement data | Addendum lines 167-175 + PRD-21C lines 805-811 | PRD-21A Seam 8 already noted LiLa proactive Vault suggestions as a declared stub. PRD-21C adds enrichment prescription to the same declared stub. | Intentional-Document (declared stub) | none (documented) | N |
| 14 | PRD-21B Moderation tab wired at `/admin/moderation` with 4 sub-tabs + Content Policy config screen | Addendum lines 74-85 + PRD-21C Screen 8 lines 393-453 + Screen 9 lines 455-498 | No `/admin/moderation` route. No ModerationPage or ModerationTab component. The `moderation_admin` permission value is reserved in `staff_permissions.permission_type` enum (migration 000002:48) but nothing grants it to any user and no page uses it. | Deferred-Document | SCOPE-3.F (low) | N |
| 15 | Admin engagement analytics | Addendum lines 88-106 + PRD-21C Screen 10 lines 500-521 | Analytics queries depend on tables that don't exist (see Seams 2-7). No admin analytics surface consumes engagement metrics. | Deferred-Document | SCOPE-3.F (low) | N |
| 16 | Per-card engagement indicators on Vault browse | Addendum lines 15-25 + PRD-21C Screen 1 lines 67-96 | `VaultContentCard` (cross-ref sibling evidence PRD-21A Seam 6) does not render engagement indicators. `useVaultBrowse.ts` types `heart_count`/`comment_count` on VaultItem but no card consumes them. | Deferred-Document | SCOPE-3.F (low) | N |
| 17 | Engagement bar on detail view + "Was this helpful?" prompt after ≥60s | Addendum lines 27-35 + PRD-21C Screen 2 lines 98-144 | Detail view has no engagement bar, no 60s timer, no satisfaction prompt. Pure absence. | Deferred-Document | SCOPE-3.F (low) | N |
| 18 | Browse page recommendation rows | Addendum lines 39-46 + PRD-21C Screen 7 lines 362-391 | Current browse layout has no recommendation rows. Data sources (first_sightings, user_visits) exist but are not consumed for recommendation rendering. | Deferred-Document | SCOPE-3.F (low) | N |
| 19 | `vault_engagement` feature key (tier gating for hearts/comments/satisfaction) | PRD-21C line 845 | No `feature_key_registry` entry for `vault_engagement`, `vault_share_external`, or `vault_share_toolbox`. Grep returns zero matches. | Deferred-Document | SCOPE-3.F (low) | N |
| 20 | Share action sheet — "+ Add to Family Member's Toolbox" and "Share from My Prompts" | Addendum lines 113-122 + PRD-21C Screen 4 lines 228-273 | Screen 4 is entirely unbuilt. When built, the Toolbox write path will inherit **PRD-21A Seam 1's broken write** (MemberAssignmentModal writes to dropped `granted_by` + renamed `is_enabled`). Cross-finding risk. | Deferred-Document **+ inherited risk** from PRD-21A Seam 1 | SCOPE-3.F (low; cross-ref PRD-21A F-A) | N |

## Unexpected findings list

1. **PRD-21C addendum claims "6 new tables" are completed (line 197) but zero exist in the live schema.** Documentation drift in the addendum's own self-reporting.
2. **Denormalized counter columns on `vault_items` are live in production with permanent zeros.** Four INTEGER NOT NULL DEFAULT 0 columns that will read 0 until a trigger is created.
3. **The `moderation_admin` permission value is reserved but nothing uses it.** Dead enum value until PRD-21C is built.
4. **No sibling comment-moderation pattern in the codebase.** `blog-comment-moderate` cited in `claude/architecture.md` does not exist on disk.
5. **PRD-21A's Toolbox-write bug (Seam 1) is an inherited blocker for PRD-21C Screen 4.** Cross-reference rather than separate finding.
6. **`shared_with_member_id` and `saved_prompt_id` columns exist in live schema with zero readers across src/.** Same "DB-shaped, server-absent" pattern.
7. **Nothing ties Vault completion to Victory Recorder.** PRD-11 (Victory) is built, `vault_user_progress.progress_status` exists, but no code path connects them.

## Proposed consolidation

### §5.1 Within-addendum consolidation

- **F-A: PRD-21C is entirely unbuilt; schema plumbing pre-seeded in anticipation but no runtime surface exists.** Consolidates Seams 1-19. Single `SCOPE-3.F` with low severity.
- **F-B (cross-reference, not a new finding): Seam 20 "Share from My Prompts" write path will inherit PRD-21A Seam 1 failure.**

Final: **1 SCOPE-3 umbrella finding.** No independent SCOPE-8b finding because the moderation pipeline is entirely unbuilt.

### §5.2 Cross-addendum candidates flagged for orchestrator

- **"DB-shaped, server-absent" pipeline pattern (elevation candidate).** Seams 1, 8, 9 + PRD-21A Seams 2, 3, 4, 7 + PRD-31 F-G all share the pattern.
- **Unbuilt PRD surfaces where pre-seeded columns carry dead data.**
- **Addendum self-reporting drift.** PRD-21C addendum line 196-205 claims "PRD-21C completed" — but tables don't exist. Worth watch-flagging whether other Cross-PRD Impact Addenda assert completion facts that are false.

## Proposed finding split

- **SCOPE-8b primary count:** 0
- **SCOPE-3-only count:** 1 (F-A umbrella — entire PRD deferred)
- **Cross-reference findings (no new SCOPE-3 emission):** 1 (F-B rides on PRD-21A.F-A)
- **Documented (no finding, declared stub):** 1 (Seam 13)
- **Provisional:** 0

**After consolidation: 1 total finding (SCOPE-3 umbrella, low severity, Deferred-Document).**

## Beta Y candidates

**None.** Every seam is Deferred-Document / Stub. None of the pre-seeded placeholder columns cause user-visible failures. Recommended Beta default for F-A: **N**.

## Top 3 surprises

1. **Addendum self-reporting claims PRD-21C "completed" when it is entirely unbuilt.** Line 196 says "PRD-21C completed (Wave 2, item 5)" and lists 6 new tables. Live schema confirms all six are absent. This is documentation drift in the addendum itself — the kind of drift that makes the addendum unreliable as a "what's built" source.

2. **Four placeholder counter columns are live in production carrying permanent zeros.** `vault_items.heart_count`, `comment_count`, `satisfaction_positive`, `satisfaction_negative` — typed, defaulted to 0, read by `useVaultBrowse`. Ship-ahead-of-code pattern.

3. **The `moderation_admin` staff_permissions enum value has been reserved for 37 migrations with no user ever granted it and no page ever checking it.** When PRD-21C's Moderation tab is built, the permission is ready — but nothing in the system today flags that this permission should be audited before it becomes a live grant.

## Watch-flag hits

- **F11:** Not applicable today. If built, inherit from PRD-31.F-G.
- **Crisis Override:** Not applicable.
- **F17:** Not applicable.
- **F22+F23:** Not applicable.
- **studio_queue:** Not applicable.
- **`is_included_in_ai`:** Not applicable.

### Additional watch-flag candidates for orchestrator

- **"Addendum claims completion when none exists" (new candidate).** Worth checking whether other "Cross-PRD Impact Addendum" files contain similar "completion" assertions that live schema contradicts.
- **"Pre-seeded placeholder columns for unbuilt PRDs" (new candidate).** Worth a grep across migrations for `-- PRD-XX future` / `-- future columns from` comments.
- **"Reserved but-ungranted permission values" (new candidate).** Check other unused permission_type enum values.

## Orchestrator adjudication

(empty — pending walk-through)
