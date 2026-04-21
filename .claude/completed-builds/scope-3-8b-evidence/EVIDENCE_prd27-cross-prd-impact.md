---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-21
Addendum: prds/addenda/PRD-27-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-27 (source) ↔ PRD-01 (Special Adult creation + assignments), PRD-02 (Permissions/Shift infrastructure), PRD-03 (member color usage in child column headers), PRD-04 (Shell Routing — CaregiverLayout deferred), PRD-10 (Widget rendering in Kid View), PRD-15 (caregiver ↔ mom messaging thread type — addendum targets wrong column), PRD-25 (Guided Dashboard inside Kid View), PRD-26 (Play Dashboard inside Kid View), PRD-35 (access_schedules replaces shift_schedules)
Provenance: Worker `addebb04692a0f03a` (Opus, report-only mode) ran the full evidence pass in-memory across the addendum (126 lines) + full PRD-27 (692 lines) + migrations (`00000000000001_auth_family_setup.sql` special_adult_assignments + `00000000000004_universal_scheduler.sql` access_schedules + `00000000000009_remediation_schema_batch.sql` shift_sessions + `00000000100146_meetings.sql` + `00000000100098_prd15_messaging_requests_notifications.sql` — confirms PRD-15 uses conversation_spaces.space_type NOT conversation_threads.thread_type) + `ShiftView.tsx` (748 lines, writes to `time_sessions`) + `usePermission.ts:86-134` (READS from `shift_sessions` — the wrong table) + `PermissionHub.tsx` + `ShellProvider.tsx:32-39` + `PerspectiveSwitcher.tsx:36-65` + `feature_expansion_registry.ts:209-210` + `live_schema.md`. Worker returned structured findings as completion text per Option B protocol; orchestrator persisted verbatim.
---

## Worker cover paragraph

Walked the PRD-27 Caregiver Tools integration surface end-to-end. The dominant finding is structural: **PRD-27 itself is unbuilt** (PRD marked "Not Started" at L8; zero migrations matching `prd27`; zero `trackable_event*`/`shift_reports` tables in live schema; zero `CaregiverLayout` component; `caregiver_tools` surfaces as a PlannedExpansionCard entry in feature_expansion_registry.ts rather than a wired feature). This is a structural unbuilt-PRD finding akin to those enumerated in DECISIONS.md Round 0 but NOT listed there — the plan's Deferred-to-Gate-4 list (PRD-20, PRD-30, PRD-32, PRD-28B, PRD-40, PRD-41) does not include PRD-27. The addendum's "fully wired" claims (L22, L34, L70) are aspirational. **The most dangerous seam that is not Deferred-to-Gate-4 is the shift session table bifurcation**: `usePermission.ts` server-side gate reads from `shift_sessions` (0 rows, table exists but unused), while `ShiftView.tsx` writes to `time_sessions` per Convention #40 — meaning a special_adult who starts a shift gets no data in `shift_sessions`, the permission check returns no-active-shift, and Special Adult access is governed only by the `access_schedules.always_on` fallback OR the `special_adult_permissions` table (0 rows live). For shift-type (non-always_on) Special Adults, the current server enforcement path is fundamentally broken. This is distinct from and more severe than the Convention #40 / Convention #236 drift noted in other evidence files. The second primary finding is the **addendum's messaging thread-type contract is architecturally wrong**: addendum L49 + L97 specify `conversation_threads.thread_type` enum gains `'caregiver'`, but PRD-15 lives on `conversation_spaces.space_type` (CHECK: `direct\|group\|family\|content_corner\|out_of_nest` — no threads-table type field exists). Cross-reference: EVIDENCE_prd14d seam #1 already captures the related PRD-27 violation of CaregiverLayout being "one page with two views, no perspective switcher."

## Per-seam two-column table

| # | Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|---|
| 1 | **Special Adult shell uses purpose-built `CaregiverLayout`** | Addendum L20 + L22 + PRD-27 Shell Behavior L331-342 | `src/components/shells/ShellProvider.tsx:37-39` routes `special_adult` to `'adult'` shell (falls into the fallback branch). No `CaregiverLayout` file exists. `ShiftView.tsx` exists as a PRD-02 Screen 6 surface but is a shift start/end widget, NOT a layout. PRD-04 deferred item is unresolved in code. | Deferred-Document (PRD-27 unbuilt) | **SCOPE-3** | N |
| 2 | **Shift session read/write table discipline** | Convention #40 + PRD-02 + addendum implicit: Special Adult shifts use `time_sessions` with `source_type='shift'`, `is_standalone=true`. | `ShiftView.tsx:550-581` writes to `time_sessions` per convention. **`usePermission.ts:87-96` READS from `shift_sessions` table** to determine active shift. `PermissionHub.tsx:833,854,1164` ALSO reads from `shift_sessions`. The two surfaces are fully decoupled: Special Adult starts a shift (writes to `time_sessions`), `shift_sessions` stays empty (0 rows live), permission check returns no-active-shift. Fallback is `access_schedules.always_on` lookup only — shift-type non-always_on Special Adults have NO working server gate. | Unintentional-Fix-Code (critical infrastructure bifurcation) | **SCOPE-8b** primary + **SCOPE-3** cross-ref | **Y** (child-data access surface for non-family-member caregivers whose server-side permission check is architecturally broken) |
| 3 | **`conversation_threads.thread_type` enum gains `'caregiver'`** | Addendum L49 + L97 + PRD-27 L441 | PRD-15 architecture uses `conversation_spaces.space_type` (migration `00000000100098:17` CHECK: `direct\|group\|family\|content_corner\|out_of_nest`). `conversation_threads` table has NO `thread_type` column — only `source_type`. Addendum targets a column that does not exist. Correct target per PRD-15 is `conversation_spaces.space_type += 'caregiver'`. | Unintentional-Fix-PRD (addendum naming drift — predates settled PRD-15 architecture) | **SCOPE-3** | N |
| 4 | **Three new tables: `trackable_event_categories`, `trackable_event_logs`, `shift_reports`** | Addendum L84-88 + PRD-27 Data Schema L354-426 | All three absent from `live_schema.md`. Zero `prd27*` migrations. No `trackable_event*` or `shift_report*` grep hits. | Deferred-Document (PRD-27 unbuilt) | **SCOPE-3** | N |
| 5 | **PRD-02 Feature Key Registry adds 4 caregiver keys** | Addendum L35 | Grep `caregiver_trackable_events\|caregiver_shift_reports\|caregiver_custody_schedule\|caregiver_messaging\|caregiver_access` returns **ZERO matches**. No feature_key_registry seed row, no `<PermissionGate>` usage. | Deferred-Document (PRD-27 unbuilt) | **SCOPE-3** | N |
| 6 | **`activity_log_entries.source` enum gains `'trackable_event'`** | Addendum L99 + PRD-27 L443 | `activity_log_entries` has `source_table TEXT` column with no CHECK constraint — column is free-form. So the enum value is additive/unenforced — no migration required. | Deferred-Document (PRD-27 unbuilt) | **SCOPE-3** | N |
| 7 | **`shift_sessions.started_by` enum gains `'auto_custody'`** | Addendum L95 + PRD-27 L439 | Migration `00000000000009:608` already includes `'auto_custody'` in the CHECK list. Enum value pre-emptively wired. No writer exists. | Intentional-Document (schema-ready, writer pending) | — | — |
| 8 | **`shift_sessions.is_co_parent_session` BOOLEAN** | Addendum L33 + PRD-27 L429-433 | Migration `00000000000009:612` includes `is_co_parent_session BOOLEAN DEFAULT false NOT NULL`. Column present. Zero rows populate it. | Intentional-Document (schema-ready) | — | — |
| 9 | **Trigger: `trackable_event_logs` AFTER INSERT → `activity_log_entries`** | Addendum L105 + PRD-27 L647 | Source table doesn't exist → no trigger possible. Absent. | Deferred-Document (PRD-27 unbuilt) | **SCOPE-3** | N |
| 10 | **Kid View renders Guided/Play dashboard in child's theme inside caregiver shell** | Addendum L57-64 + PRD-27 Screen 2 L114-145 | `CaregiverLayout` absent; no Kid View component; no "tap child button → render target dashboard" composition. | Deferred-Document (PRD-27 unbuilt) | **SCOPE-3** | N |
| 11 | **Co-parent custody schedule always-on grace period (5-minute)** | Addendum L23 + L42 + PRD-27 L521-522 | Grep `5.*minute.*grace\|grace_period_minutes\|5_minute_grace` → zero matches. `access_schedules` helper `is_member_available()` returns NULL for shift/custody (client-side RRULE eval deferred) — no grace-period semantic exists in server logic. | Deferred-Document (PRD-27 unbuilt) | **SCOPE-3** | N |

## Unexpected findings list (seams not covered in addendum)

1. **PRD-27 is unbuilt — the addendum reads as completed integrations but 10 of 11 seams are "absent because the PRD hasn't been built yet."** This is a structural unbuilt-PRD case analogous to PRD-20/PRD-30/PRD-32 in DECISIONS.md Round 0, but PRD-27 is NOT listed on that Deferred-to-Gate-4 table. Recommend orchestrator ADD PRD-27 to Round 0 Deferred table.

2. **Shift session bifurcation is the genuinely dangerous finding in this file.** Convention #40 says write to `time_sessions`; `ShiftView.tsx` does. `usePermission.ts:87-96` reads from `shift_sessions`. The two paths are disconnected. This is a FRESH F11 server-side enforcement contributor that is NOT conditioned on PRD-27 being built — it affects any special_adult that exists today. The live 2 `special_adult_assignments` rows mean this code path is reachable in production right now.

3. **`is_member_available()` PL/pgSQL helper returns NULL for shift/custody schedules** (migration `00000000000004:88-91`), explicitly punting to client-side RRULE. This means server-side RLS cannot make a permission decision about whether a non-always_on Special Adult's access window is currently open. Combined with finding #2, the *entire shift-window enforcement model for non-always_on Special Adults is client-side only*.

4. **Addendum's PRD-15 target column is wrong (`conversation_threads.thread_type` does not exist).** The correct integration would target `conversation_spaces.space_type`. Will cause a pre-build audit question.

5. **PRD-27 scope collides with PRD-14D seam #1 (PerspectiveSwitcher overgrants to special_adult).** PRD-27 Shell Behavior says CaregiverLayout has "no navigation complexity" — PerspectiveSwitcher should NEVER render for special_adult. Cross-reference documented.

## Proposed consolidation (§5.1 + §5.2 candidates)

**§5.1 within-addendum:**
- Seams #1, #4, #5, #9, #10, #11 consolidate to: **"PRD-27 caregiver experience is unbuilt — entire cross-PRD integration surface absent."** (7 sub-elements → 1 structural Deferred-Document finding.)
- Seams #7, #8 are schema-ready positives (no finding).
- Seam #6 is schema-permissive (enum-free column — additive only) — no finding.
- Seam #2 stands alone as the primary SCOPE-8b.
- Seam #3 stands alone as PRD addendum naming drift.

**§5.2 cross-addendum candidates:**

**A. F11 server-side enforcement — PRD-27 contributes 1 fresh surface (the 7th overall).**

| Surface | Gap |
|---|---|
| PRD-15 | Per-pair `member_messaging_permissions` client-side only |
| PRD-17B | `classify_by_embedding` RPC trusts caller `p_family_id` |
| PRD-18 | `match_book_extractions` RPC trusts caller `p_family_id` |
| PRD-21 | `lila_tool_permissions` never checked by tool Edge Functions |
| PRD-22 | `member_emails` login resolution not enforced |
| PRD-22 | `lila_member_preferences` not loaded |
| **PRD-27 (new)** | **Special Adult shift-window permission check reads `shift_sessions` (empty) while writes go to `time_sessions`; `is_member_available()` punts to NULL** |

**Pattern now at 7 surfaces. PRD-27 is a particularly severe contributor because it affects LIVE data today. ESCALATE.**

**B. "Convention exists but infrastructure split between two tables" pattern — NEW signal.**

Single occurrence. Not yet escalate-worthy — but watch.

**C. Addendum target-column naming drift.**

| Surface | Gap |
|---|---|
| PRD-16 addendum | `calendar_events.source` vs live `source_type` |
| **PRD-27 addendum (new)** | **`conversation_threads.thread_type` (does not exist) vs canonical `conversation_spaces.space_type`** |

2 occurrences. Watch for third to escalate.

**D. Unbuilt-PRD classification — PRD-27 belongs in Round 0 Deferred-to-Gate-4 table.**

Current list: PRD-20, PRD-30, PRD-32/32A, PRD-28B seam, PRD-40, PRD-41. **Recommend amendment.**

## Proposed finding split

- **F-A: Special Adult shift-window permission check reads wrong table (`shift_sessions`) while writes target `time_sessions`** (seam #2 + Unexpected #2 + Unexpected #3). Live surface: 2 `special_adult_assignments` rows. **SCOPE-8b primary + SCOPE-3 cross-ref. Beta Y.**
- **F-B: PRD-27 caregiver experience is entirely unbuilt; addendum describes aspirational integrations as "fully wired"** (seams #1 + #4 + #5 + #9 + #10 + #11 consolidated). Recommend orchestrator ADD PRD-27 to DECISIONS.md Round 0 Deferred-to-Gate-4 table. **SCOPE-3 (structural — Deferred-Document). Beta N.**
- **F-C: PRD-27 addendum targets nonexistent `conversation_threads.thread_type` column** (seam #3 + Unexpected #4). **SCOPE-3 (Unintentional-Fix-PRD). Beta N.** Informational.

**0 additional SCOPE-8b findings** beyond F-A.

## Beta Y candidates

1. **F-A (SCOPE-8b side)** — Shift-window permission check reads the wrong table. Live surface with 2 rows. Affects existing PRD-01/PRD-02 Special Adult infrastructure, NOT conditioned on PRD-27 build. Fix is surgical: change the `usePermission.ts` and `PermissionHub.tsx` queries to read `time_sessions WHERE source_type='shift' AND ended_at IS NULL` (one file-pair change). Or consolidate the two tables with a migration that either deprecates `shift_sessions` or makes it a view over `time_sessions`.

## Top 3 surprises

1. **PRD-27 is unbuilt but NOT on the Round 0 Deferred-to-Gate-4 list** despite meeting identical criteria. The addendum's "resolved / fully wired / confirmed" language obscures that nothing is actually built.

2. **The shift-session bifurcation is a live F11 gap affecting existing PRD-02 Special Adult infrastructure, not a PRD-27-future concern.** `ShiftView.tsx` writes to `time_sessions` per Convention #40. `usePermission.ts:87-96` reads from `shift_sessions`. Both files are active today.

3. **`is_member_available()` PL/pgSQL helper explicitly returns NULL for shift/custody schedules, punting to client-side RRULE evaluation.** Effectively all non-always_on Special Adults are permanently denied by the server, UNLESS some other code path grants access via a different check. A surprising safety-posture — everything is fail-closed by accident, not by design.

## Watch-flag hits

- **F11 server-side enforcement — DIRECT HIT. Beta Y on F-A.** Cross-addendum F11 pattern now at 7 surfaces — **ESCALATE.**
- **Crisis Override** — N/A (PRD-27 Shell Behavior L338 explicitly "No LiLa access").
- **F17 messaging** — Partial hit via seam #3 (addendum targets wrong column).
- **F22+F23 archive column drift** — Non-hit.
- **studio_queue source discipline** — CONFIRMED N/A.
- **`is_included_in_ai` three-tier propagation** — N/A.
- **Convention #40 (shift uses time_sessions with source_type='shift')** — Partial compliance: write side follows convention; read side reads `shift_sessions` table. **This is the F11 hit above.**
- **Convention #236 (Special Adults NO meeting access)** — Already captured in EVIDENCE_prd16 seam #3.
- **PRD-14D seam #1 (PerspectiveSwitcher overgrants to special_adult)** — Confirmed cross-reference.

## Orchestrator adjudication

(empty — pending walk-through)
