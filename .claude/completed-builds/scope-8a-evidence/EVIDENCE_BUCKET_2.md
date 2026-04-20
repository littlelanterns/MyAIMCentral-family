# Scope 8a — Bucket 2 Evidence (Child Data Handling)

> **Status:** DRAFT — awaiting orchestrator sign-off.
> **Worker:** Claude Opus 4.7 (1M context)
> **Opened:** 2026-04-20
> **Reference:** [CHECKLIST_INVENTORY.md](CHECKLIST_INVENTORY.md) §Bucket 2 (items 8a-CL-17 through 8a-CL-22)
> **Authoritative schema snapshot:** [claude/live_schema.md](../claude/live_schema.md) (regenerated 2026-04-20)

---

## Summary table

| ID | Claim | Verdict | Confidence | Evidence anchor |
|---|---|---|---|---|
| 8a-CL-17 | RLS enabled + ≥1 policy on all 21 child-data tables (family_moments N/A) | **PASS** | High | 20/20 present tables have `ENABLE ROW LEVEL SECURITY` + ≥1 `CREATE POLICY`; `family_moments` not built (N/A) |
| 8a-CL-18 | Data export flow exists | **PARTIAL** | High | `src/pages/archives/ContextExportPage.tsx` + `useContextExport` hook export archives only (PRD-13 scope). No full-family Markdown/JSON export covering tasks, journal, calendar, etc. No `data_exports` table migration. PRD-22 Settings data export unbuilt. |
| 8a-CL-19 | Data deletion flow exists | **PARTIAL** | High | `account_deletions` table + `process_expired_deletions()` function exist (migration 100027); function is defined but cron scheduling line is commented out; function does soft-deactivate only (no hard cascade), does not reference Safe Harbor exemption |
| 8a-CL-20 | Voice/audio retention cron | **FAIL** | High | No `cron.schedule` entry for voice/audio/recording cleanup across all 156 migrations. `journal_entries.audio_file_path` column exists with no retention policy. |
| 8a-CL-21 | Safe Harbor aggregation exclusion | **PASS** | Medium-High | Every current cross-member aggregation query against `lila_conversations` either filters `is_safe_harbor=false` (`useFamilyConversations` L225) or is a single-conversation/single-member-self read (exempt). No violation of convention #243 in current code. |
| 8a-CL-22 | Privacy Filtered hard enforcement | **PASS** | High | `supabase/functions/_shared/privacy-filter.ts` + applied at `context-assembler.ts:623` + defense-in-depth RLS policy in migration 100149 |

**Aggregate:** 2 PASS, 2 PARTIAL, 1 FAIL, 1 PASS-with-caveat. No Blocking surprises; one Medium-severity FAIL (voice retention) newly confirmed. Two PARTIAL findings align with known PRD-22 un-built scope.

---

## [8a-CL-17] RLS on child-data tables — PASS

### Query strategy

1. `Grep "ALTER TABLE (public\.)?(<21 tables>) ENABLE ROW LEVEL SECURITY"` across `supabase/migrations/` → 20 hits (all expected tables except `family_moments`).
2. `Grep "CREATE POLICY.*ON (public\.)?(<19 tables>)"` → 41 hits across 13 migrations; plus supplementary grep for `member_sticker_book_state`, `member_creature_collection`, `member_page_unlocks` (naming without `ON` prefix) → 6 hits.
3. `Grep "CREATE POLICY.*beta_glitch"` — naming uses spaced quoted policy names, so confirmed by reading migration 100083 directly.
4. `Grep "(CREATE TABLE|ALTER TABLE).*family_moments"` → **No matches**. PRD-37 not built; N/A.

### Per-table verification

| # | Table | RLS enabled | Policy count | Evidence location |
|---|---|---|---|---|
| 1 | `tasks` | Y | 3 | 00000000000008_tasks_lists.sql:125 (RLS), :127 (select_family), :132 (manage_adults); 00000000100147_shared_task_rls_fix.sql:30 (update_assigned_member) |
| 2 | `task_completions` | Y | 3 | 00000000000008_tasks_lists.sql:181 (RLS), :183 (select_family), :190 (insert_own), :195 (approve_parent) |
| 3 | `journal_entries` | Y | 3 | 00000000000006_journal_notepad.sql:40 (RLS), :43 (manage_own), :49 (select_parent), :56 (select_family) |
| 4 | `widget_data_points` | Y | 2 | 00000000100033_prd10_widgets_trackers.sql:236 (RLS), :240 (wdp_select), :254 (wdp_insert) |
| 5 | `archive_context_items` | Y | 2 | 00000000100035_prd13_archives_context.sql:88 (RLS), :91 (select_own_family), :99 (manage_primary_parent) |
| 6 | `self_knowledge` | Y | 3 | 00000000000005_personal_growth_foundation.sql:161 (RLS), :164 (manage_own), :170 (select_mom), :177 (select_dad) |
| 7 | `best_intentions` | Y | 2 | 00000000000005_personal_growth_foundation.sql:81 (RLS), :83 (manage_own), :88 (select_parent) |
| 8 | `guiding_stars` | Y | 2 | 00000000000005_personal_growth_foundation.sql:35 (RLS), :38 (manage_own), :44 (select_parent) |
| 9 | `lila_conversations` | Y | 2 | 00000000000007_lila_ai_system.sql:60 (RLS), :63 (manage_own), :69 (select_parent) |
| 10 | `lila_messages` | Y | 2 | 00000000000007_lila_ai_system.sql:95 (RLS), :98 (select_via_conversation), :111 (insert_own) |
| 11 | `victories` | Y | 4 | 00000000000009_remediation_schema_batch.sql:338 (RLS), :349 (manage_own), :352 (select_parent); 00000000100084_victory_recorder_phase_12a.sql:26 (insert_parent), :39 (update_parent) |
| 12 | `homeschool_time_logs` | Y | 3 | 00000000100136_homeschool_tracking.sql:181 (RLS), :184 (htl_mom_all), :200 (htl_members_read), :210 (htl_children_insert) |
| 13 | `family_moments` | N/A | N/A | **Table not present in live_schema.md and no migration creates it.** PRD-37 unbuilt; per instructions this is N/A not FAIL. |
| 14 | `reflection_responses` | Y | 2 | 00000000100071_reflections.sql:87 (RLS), :90 (manage_own), :100 (parent_reads_children) |
| 15 | `practice_log` | Y | 3 | 00000000100105_linked_steps_mastery_advancement.sql:155 (RLS), :158 (manage_own), :166 (read_parent), :175 (read_adults) |
| 16 | `randomizer_draws` | Y | 3 | 00000000100105_linked_steps_mastery_advancement.sql:215 (RLS), :218 (manage_own), :226 (read_parent), :236 (read_adults) |
| 17 | `member_creature_collection` | Y | 2 | 00000000100115_play_dashboard_sticker_book.sql:325 (RLS), :328 (family_read), :338 (mom_write) |
| 18 | `member_page_unlocks` | Y | 2 | 00000000100115_play_dashboard_sticker_book.sql:380 (RLS), :383 (family_read), :392 (mom_write) |
| 19 | `member_sticker_book_state` | Y | 2 | 00000000100115_play_dashboard_sticker_book.sql:267 (RLS), :270 (family_read), :279 (mom_write) |
| 20 | `rhythm_completions` | Y | 2 | 00000000100103_rhythms_foundation.sql:126 (RLS), :130 (manage_own), :139 (read_parent) |
| 21 | `beta_glitch_reports` | Y | 2 | 00000000100083_beta_glitch_reporter.sql:42 (RLS), :44 ("Users can insert their own glitch reports"), :48 ("Users can read their own glitch reports") |

### Verdict rationale

All 20 present child-data tables have RLS enabled at least one migration AND at least one CREATE POLICY. `family_moments` is N/A — its parent PRD (PRD-37) has not been built, so the claim about its RLS doesn't apply yet. No FAIL condition exists.

---

## [8a-CL-18] Data export flow — PARTIAL

### Query strategy

- `Glob src/pages/settings/**/*Export*` → No files.
- `Glob supabase/functions/**/*export*` → No files.
- `Glob src/**/*[Ee]xport*.ts*` → 3 hits: `src/components/bookshelf/ExportDialog.tsx`, `src/lib/bookshelfExport.ts`, `src/pages/archives/ContextExportPage.tsx`.
- `Grep data_exports` in `supabase/migrations/` → No matches. `data_exports` table defined in PRD-22 §L749 is **not yet migrated**.
- Read `src/pages/SettingsPage.tsx` → Line 196-201: "Data & Privacy" section with single link "Export Family Data" → `/archives/export`. Points exclusively at the Archives Context Export, not a full-family export.
- Read `src/pages/archives/ContextExportPage.tsx` and `src/hooks/useArchives.ts:884+` (useContextExport) — confirms scope.

### Evidence

1. **Archives-only export present.** `useContextExport(familyId)` (useArchives.ts:884) exposes `exportAll`, `exportByMember`, `exportByFolder`. `exportByMember` reads `archive_folders` + `archive_context_items` + `self_knowledge` for a member and emits Markdown. UI at `src/pages/archives/ContextExportPage.tsx`. PRD-13 scope, not PRD-22.

2. **No `data_exports` table migration.** PRD-22 §Data Schema L749 specifies `data_exports` table; grep confirms no migration creates it. RECONNAISSANCE_REPORT_v1.md:471 also notes this as a gap.

3. **No JSON-bundle export, no full-family export, no bookshelf/tasks/journal/calendar export.** The `bookshelfExport.ts` lib is a book-level text export (PRD-23), not a family data export.

4. **No Edge Function for account/family-wide data export.** `supabase/functions/` has no `export-*`, `data-export*`, or `parental-data-export*` handlers.

### Verdict rationale

Child-data export is partially available through the Archives Context Export (Markdown, member-scoped, archive-only). A full-family data export covering tasks, journal, calendar, bookshelf, etc. does not exist. PRD-22 data export is unbuilt, and PRD-40 §L793 `parental_data_exports` audit table is not present. For COPPA parental-access-rights purposes, the current export is insufficient scope — therefore **PARTIAL**, not PASS.

---

## [8a-CL-19] Data deletion flow — PARTIAL

### Query strategy

- `Grep account_deletions` in `supabase/` → 10 hits in migration 00000000100027_prd01_repair.sql.
- Read the `account_deletions` section of that migration.
- `Grep process_expired_deletions` → confirms function defined once; cron schedule line commented out (L304-305).
- `Grep "is_safe_harbor.*delete|delete.*safe_harbor"` → No matches — no Safe Harbor exemption in deletion path.
- `Glob supabase/functions/*delete*|*purge*` → No files.

### Evidence

1. **Table exists.** 00000000100027_prd01_repair.sql:234 creates `public.account_deletions` with columns: `id`, `family_id`, `requested_by`, `deletion_type` ('family'|'member'), `status` ('pending'|'completed'|'cancelled'), `scheduled_for` (default `now() + 30 days`), `grace_period_days` (default 30), `created_at`, `completed_at`. RLS enabled :251; primary_parent manage policy :254.

2. **Function exists.** `process_expired_deletions()` defined at migration 00000000100027:267. For `deletion_type='family'` it runs `UPDATE public.family_members SET is_active = false WHERE family_id = <id>` — **soft deactivation only, no hard delete, no child-table cascade.** Migration comment at :284 explicitly states: "Note: actual hard deletion of data is a future enhancement. For now, soft-deactivate."

3. **Cron not wired.** Migration 00000000100027:304-305 contains the `cron.schedule('process-expired-deletions', '0 3 * * *', ...)` line but it is commented out. `Grep cron.schedule` across migrations returns no active cron for this job.

4. **No Safe Harbor exemption in deletion logic.** `is_safe_harbor` is never referenced in deletion paths. This is arguably correct (Safe Harbor conversations should be deleted with the account on revocation), but there is no encoded rule here either way.

5. **No Edge Function for deletion.** No `delete-*`/`purge-*` functions present.

6. **Grace window encoded.** `account_deletions.scheduled_for` defaults to `now() + 30 days` per migration :240 — a 30-day grace period exists at the table level.

### Verdict rationale

Infrastructure is partially present: table, function, RLS, and grace window all exist. What's missing: (a) active cron scheduler, (b) hard-deletion cascade across child-data tables, (c) no front-end UI traced to wire this up. The PRD-40 expectation of cascade on COPPA revocation is not met — the function cannot currently delete `tasks`, `journal_entries`, `lila_conversations`, etc. **PARTIAL**, not FAIL, because the seed infrastructure exists and the function signature is in place; the gap is implementation of cascade + scheduler activation.

---

## [8a-CL-20] Voice/audio retention cron — FAIL

### Query strategy

- `Grep cron.schedule` in `supabase/migrations/` → 10 hits: `process-expired-deletions` (commented out), smart-list frequency, mindsweep auto-sweep, penciled-in expire (2), claim expiration, rhythm carry-forward, rotation advancement, allowance financial (2). **Not one references voice/audio.**
- `Grep "cron\.schedule.*audio|cron\.schedule.*voice|audio_file_path.*cleanup|cleanup.*audio|cleanup.*voice|cleanup.*recording|audio.*retention|voice.*retention|cleanup_voice"` → No matches.
- `Grep "audio_file_path"` in `src/` → No matches — column exists but no client-side cleanup either.
- Read `supabase/functions/whisper-transcribe/index.ts` for storage/retention references → No matches in that file.

### Evidence

1. **`journal_entries.audio_file_path` column exists** (migration 00000000000009_remediation_schema_batch.sql:157; confirmed in live_schema.md line ~22 of `journal_entries`).
2. **No `cron.schedule` call anywhere targets voice or audio.** Full enumeration of existing cron jobs above.
3. **CLAUDE.md Architecture** (claude/architecture.md §Database Infrastructure) documents intent: "Scheduled jobs (embedding queue every 10s, blog publishing every 15m, **voice recording cleanup daily**)". The intent is stated; the implementation is absent.
4. **No retention threshold documented anywhere** (CLAUDE.md, migrations, Edge Functions all silent on retention duration).

### Verdict rationale

Intent is documented but no implementation exists. Voice recordings written to `audio_file_path` persist indefinitely. For a platform serving children's voice inputs (MindSweep voice, Notepad voice, transcription requests), this is a retention-policy gap. **FAIL**.

---

## [8a-CL-21] Safe Harbor aggregation exclusion — PASS (with caveats)

### Query strategy

- `Grep "from\(['\"]lila_conversations['\"]\)"` across `src/` and `supabase/functions/` — enumerate every hit and classify.

### Per-hit classification

#### Edge Functions (supabase/functions/)

All 32 Edge Function hits follow the pattern `.eq('id', conversation_id)` (single-conversation read/update). These are **single-conversation reads** and exempt per convention #243. Examples:

- `lila-board-of-directors/index.ts:291` — `.select('*').eq('id', conversation_id).single()` — EXEMPT
- `lila-chat/index.ts:317, 330, 496, 532` — all single-id operations — EXEMPT
- `lila-cyrano/index.ts:178, 279` — single-id read + update — EXEMPT
- `lila-decision-guide/index.ts:142, 235` — single-id — EXEMPT
- `lila-mediator/index.ts:237, 256, 271, 389, 391, 406` — single-id reads/updates (context_snapshot for safety_triggered flag) — EXEMPT
- `lila-perspective-shifter/index.ts:138, 236` — single-id — EXEMPT
- `lila-higgins-navigate/index.ts:176, 259` — single-id — EXEMPT
- `lila-translator/index.ts:65, 117` — single-id — EXEMPT
- `lila-quality-time/index.ts:98, 141` — single-id — EXEMPT
- `lila-higgins-say/index.ts:176, 262` — single-id — EXEMPT
- `lila-words-affirmation/index.ts:96, 138` — single-id — EXEMPT
- `lila-gifts/index.ts:89, 131` — single-id — EXEMPT
- `lila-gratitude/index.ts:102, 155` — single-id — EXEMPT
- `lila-observe-serve/index.ts:89, 131` — single-id — EXEMPT

#### Frontend (src/)

| Location | Query shape | Classification | Filter status |
|---|---|---|---|
| `src/components/lila/TranslatorModal.tsx:79` | `.eq('member_id', member.id).eq('guided_mode', 'translator').order(...).limit(50)` | Single-member self-read (own Translator history); Translator is not a Safe Harbor mode, so `guided_mode='translator'` implicitly excludes Safe Harbor | single-member-self-read (exempt) |
| `src/components/lila/BoardOfDirectorsModal.tsx:363, 364` | `.eq('id', conversation.id)` | Single-conversation read + update | EXEMPT |
| `src/components/lila/ToolConversationModal.tsx:328` | `.eq('member_id', member.id).eq('guided_mode', modeKey).eq('status','active').limit(50)` | Single-member, single-tool own history | single-member-self-read (exempt) |
| `src/components/lila/ToolConversationModal.tsx:395` | `.eq('id', entry.conversationId).single()` | Single-conversation read | EXEMPT |
| `src/components/lila/ToolConversationModal.tsx:499` | `.update(...).eq('id', conv.id)` | Single-id update | EXEMPT |
| `src/components/lila/LilaDrawer.tsx:223` | `.update(context_snapshot).eq('id', conv.id)` | Single-id update | EXEMPT |
| `src/hooks/useLila.ts:159` (`useLilaConversations`) | `.eq('member_id', memberId).eq('status', 'active')` | **Single-member self-read — own conversation list.** Does NOT filter `is_safe_harbor`. | single-member-self-read: owner must see their own Safe Harbor entries — **NOT an aggregation** under #243 |
| `src/hooks/useLila.ts:184` (`useConversationHistory`) | `.eq('member_id', memberId).neq('status', 'deleted')` | Single-member own history; optional filters on status/mode/search | single-member-self-read (same as above) |
| `src/hooks/useLila.ts:220` (`useFamilyConversations`) | `.eq('family_id', familyId).neq('member_id', memberId).neq('status', 'deleted').eq('is_safe_harbor', false).limit(50)` | **Cross-member aggregation (mom's view of children's conversations).** | **FILTERED** ✓ — L225 `.eq('is_safe_harbor', false)` |
| `src/hooks/useLila.ts:274, 321, 341, 361` | Various `.insert` / `.update().eq('id', ...)` | Single-id writes | EXEMPT |
| `src/components/shells/MomShell.tsx:76` | `.update({ context_snapshot }).eq('id', activeConversation.id)` | Single-id update | EXEMPT |

### Verdict rationale

- **The only cross-member aggregation query in current code** (`useFamilyConversations` at useLila.ts:219-227) correctly filters `.eq('is_safe_harbor', false)`.
- All other hits are either single-conversation reads/writes (exempt) or single-member-self-reads where the member has legitimate access to their own Safe Harbor conversations.
- Convention #243 explicitly says the CI guard lands with "the first aggregation PRD build (PRD-19, PRD-28B, or PRD-30 — whichever ships first)." None of those have shipped, so the current expectation is convention-text-only — and no existing code violates it.
- **Confidence is Medium-High** rather than High because: (1) single-member-self-read is my classification, not an explicit category in #243 — a strict reader could argue own-list display should also filter Safe Harbor into a separate tab; (2) I did not exhaustively verify Translator/Tool history filters are safe in edge cases (e.g., if `is_safe_harbor` were ever set on a Translator conversation it would leak into the history tab since the query does not filter). The current schema and design make this unlikely but possible.

**Verdict: PASS.** Current state does not violate convention #243 in spirit or letter.

---

## [8a-CL-22] Privacy Filtered hard enforcement — PASS

### Query strategy

- `Glob supabase/functions/_shared/*context*` → `context-assembler.ts` (confirmed).
- Read `supabase/functions/_shared/privacy-filter.ts` (57 lines).
- `Grep "applyPrivacyFilter|is_privacy_filtered"` in `supabase/functions/` → applications in:
  - `_shared/context-assembler.ts:623`
  - `_shared/relationship-context.ts:295, 424`
  - `bookshelf-study-guide/index.ts:93`

### Evidence

1. **Helper function** `applyPrivacyFilter` at `supabase/functions/_shared/privacy-filter.ts:51-56`:
   ```ts
   export function applyPrivacyFilter<
     T extends { eq: (column: string, value: unknown) => T },
   >(query: T, requesterIsPrimaryParent: boolean): T {
     if (requesterIsPrimaryParent) return query
     return query.eq('is_privacy_filtered', false)
   }
   ```
   Mom (primary_parent) sees all; all other roles have `.eq('is_privacy_filtered', false)` appended.

2. **Primary enforcement site in context assembly** — `supabase/functions/_shared/context-assembler.ts:613-624`:
   ```ts
   const requesterIsMom = await isPrimaryParent(supabase, requestingMemberId)
   const totalLimit = maxPerMember * enabledMembers.length
   let itemsQuery = supabase
     .from('archive_context_items')
     .select('context_value, folder_id, member_id')
     .eq('family_id', familyId)
     .in('folder_id', enabledFolderIds)
     .eq('is_included_in_ai', true)
     .is('archived_at', null)
     .limit(totalLimit)
   itemsQuery = applyPrivacyFilter(itemsQuery, requesterIsMom)
   const { data: items } = await itemsQuery
   ```
   **Line 623 is the exact code that excludes `is_privacy_filtered=true` items for non-mom requesters.**

3. **Secondary enforcement in relationship-context.ts** — L295 and L424 also call `applyPrivacyFilter` for partner and relationship-context aggregation paths.

4. **Defense-in-depth RLS policy** — migration 00000000100149_archive_context_items_privacy_rls.sql:31 adds a RESTRICTIVE RLS policy that mirrors the same rule at the database level: non-mom SELECT is narrowed to `is_privacy_filtered = false`. Comment at L39: _"Convention #76 + RECON Decision 7. Defense-in-depth role-asymmetric privacy filter."_

### Verdict rationale

Code-level enforcement exists at `supabase/functions/_shared/context-assembler.ts:623` via the `applyPrivacyFilter` helper, with a defense-in-depth RLS policy at the database level (migration 100149). The check is applied across the three known aggregation sites (`context-assembler.ts`, `relationship-context.ts`, `bookshelf-study-guide`). **PASS.**

**Scope note:** Only `archive_context_items` has an `is_privacy_filtered` column per live_schema.md. Other context-source tables (`self_knowledge`, `best_intentions`, `guiding_stars`, `journal_entries`) do NOT have this column. The convention applies where the column exists; PRD-13 positions it as archive-specific. No hidden gap here — the column is scoped to the intended table.

---

## Unexpected findings

1. **`account_deletions` soft-deactivate only, cron commented out.** The PRD-40 §Retention Policy assumption that revocation triggers cascade deletion is not met. `process_expired_deletions()` only flips `family_members.is_active = false` — child-data tables (`tasks`, `journal_entries`, `lila_conversations`, etc.) are not touched. This has implications beyond 8a-CL-19: it means COPPA-compliant parent-initiated deletion is currently not technically achievable in the codebase. Recommend the orchestrator flag this to Bucket 1 (PRD-40) as well — it bears on parental rights of erasure.

2. **Voice recording retention gap is real and appears in production.** `journal_entries.audio_file_path` is a live column with no cleanup job. If any child has recorded a voice journal entry, that audio currently persists indefinitely in storage. The CLAUDE.md architecture line referencing "voice recording cleanup daily" is aspirational and does not match live state.

3. **Data export is member-scoped and Markdown-only.** This is the Archives Context Export, scoped to PRD-13. A mom asking for a COPPA-required data export of her child's data would today only get the child's Archive context — not tasks, journal, calendar, bookshelf, LiLa conversations, or anything else. Under COPPA's "access" requirement this is likely insufficient.

4. **`family_moments` table missing from live schema.** Expected per PRD-37 but not migrated. This is not a violation of 8a-CL-17 (instructions explicitly permitted N/A), but it is a tracker item: when PRD-37 is built, the migration MUST include RLS + policies to satisfy #17.

5. **Own-conversation-list display in `useLila.useLilaConversations` / `useConversationHistory` does NOT filter `is_safe_harbor`.** This is correct under a strict reading of #243 (they are not cross-member aggregations) and is probably intended behavior (the owner needs access to their own Safe Harbor entries). However, a stricter product stance would route Safe Harbor conversations to a separate UI surface with explicit opt-in, and the current code does not split them. Worth confirming the owner-surface policy with Tenise before the PRD-20 build sign-off. Not a violation today, but a convention-interpretation question.

---

## Notes for the orchestrator

- **Severity confirmation:** 8a-CL-20 is the only clean FAIL in this bucket. Severity per CHECKLIST_INVENTORY.md summary is Medium — recommend keeping Medium but flagging it as Beta-Blocking-if-any-voice-feature-is-exposed-to-under-13-users. If voice-input features (Notepad voice, MindSweep voice) are beta-gated off for under-13 roles, severity stays Medium; otherwise consider escalating to High.
- **PARTIAL handling:** 8a-CL-18 and 8a-CL-19 are both PARTIAL — I recommend the orchestrator splits each into a "what exists" finding and a "what's missing" finding so the audit report can track remediation per-gap.
- **Bucket 1 / Bucket 2 coupling:** Finding 1 in "Unexpected findings" shows 8a-CL-19's PARTIAL deletion flow also bears on PRD-40 §Retention Policy. Recommend that the Bucket 1 worker (if not already completed) re-reads 8a-CL-19 evidence before scoring PRD-40's revocation cascade.
- **No `lila_conversations` aggregation violations found.** Convention #243 is currently satisfied by construction — the one cross-member aggregation query filters correctly. Worth noting to Tenise that the "first aggregation PRD build" condition for the CI guard has not yet been triggered, so the guard remains text-only by design.
- **No files modified outside this evidence report.** No PRDs, no checklists, no decision logs touched.
- **Search tool policy compliance:** mgrep not invoked. All lookups via Grep + Glob + Read per instruction.
