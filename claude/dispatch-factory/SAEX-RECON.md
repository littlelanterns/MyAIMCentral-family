# SAEX — Special Adult Experience + PRD-27 Recon Brief (Sonnet agent, 2026-07-04)

> Archived condensed with citations. Consumed by `SAEX.md`.

## A. Current state (re-verified + new findings)

1. **No SA branch anywhere:** getShellForMember falls through special_adult → 'adult' (ShellProvider.tsx:36-43); ShellType is a hardcoded 5-value union (tokens.ts:29). **Ready-made precedent for a role-based pre-shell detour: RoleRouter.tsx:41-43 already redirects role='family' → /hub before shell rendering.** AdultShell gives SA Notepad + QuickTasks AI launcher + full Vault + full adult sidebar (Sidebar.tsx:244-318) — violating PRD-27's "No LiLa access of any kind. No personal features" (L337-341).
2. **ShiftView built, unrouted, incomplete:** 748 lines, exported, ZERO render sites. Implements always-on badge/start-end shift/next-window/read-only activity feed — but NOT the [Log Activity] form both PRDs require (STUB:93 confirms). Writes shifts to **time_sessions** (source_type='shift', is_standalone=true, :554-579) per Convention #40.
3. **SPLIT-BRAIN (new finding):** mom's ENTIRE SA monitoring UI — PermissionHub SpecialAdultCard active-shift badge (:1009-1022), remote End Shift (:1030-1041), ShiftLogSection (:1301-1402) — AND usePermission's special_adult branch (usePermission.ts:87-138, :90) all read the DEAD `shift_sessions` table (migration 9:602-626; **0 rows**). ShiftView writes time_sessions. The two halves never meet: **shift-gated permission grants can NEVER evaluate true in production; mom's End Shift operates on rows that never exist; Shift Log reads forever-empty.**
4. `special_adult_permissions` (0 rows): only reader is the unreachable usePermission branch; the Hub per-kid grid was REMOVED by PERMISSIONS-WIRING (:1168-1171 comment) pending this build.
5. **Three-way feature-key vocabulary drift:** Hub grid (tasks_basic/calendar_basic/notes_instructions) vs permission_level_profiles seed (migration 12:229-243: tasks_basic/calendar_basic/lila_help/messaging_basic — **lila_help violates PRD-27's no-LiLa rule**) vs PRD-02/27 spec set (tasks_routines/trackable_events/notes_instructions/shift_notes/calendar/messaging; migration 9:483-491 presets). keyWiringStatus.ts: ZERO SA entries.
6. useViewableMembers: SA = self-only BY DESIGN (:10-11, :138-141 — "shift-scoped surfaces handle their own access") — **no such surface exists; net-new hook needed.**
7. **access_schedules is read-only infra with NO write path anywhere** (4 files, all reads; 0 rows) — PRD-02 Screen 3 §3 schedule-config UI entirely unbuilt; recurring/always_on schedules can never be created today.
8. SA auth = PRD-01 email-invite/share-link/PIN (L373) — relationship to two-door model (Convention #273) unverified; open question incl. whether SAs appear on the family-door roster.
9. View-As already offers SA in the picker (ViewAsMemberPicker.tsx:24-26) — renders the wrong full adult shell; useEffectiveShell caregiver case doesn't exist.
10. PRD-28 money exclusion holds only as a SIDE EFFECT (financial grants hard-scoped role='additional_adult' in 100260 RLS predicates :169-278) — no explicit SA deny anywhere.

## B. PRD-27 scope (L-refs)

S1 Caregiver Main View (L52-113: swipeable member-colored kid columns, trackable-event tap rows + quick-note, running Shift Log, persistent top bar); S2 Kid View (L114-146: renders the kid's ACTUAL Guided/Play dashboard filtered by special_adult_permissions; all records tagged shift_session_id); S3 Co-Parent (L147-189: no shift UI for always_on/custody; Activity Log by date; outside-window lockout w/ next-window; messaging NEVER gated); S4 Trackable Event Config (L191-241: per-child CRUD, 5 preset bundles APPEND not override, per-item edit incl. require_note/allow_multiple/drag-order); S5 Shift History & Reports (L242-291: filterable timeline, custom-report modal, LiLa-compiled chronological/aggregated output); S6 Caregiver Messages (L293-316: mom-only thread, photo, shift tagging). Tables: trackable_event_categories, trackable_event_logs, shift_reports (L354-425); shift_sessions.is_co_parent_session (exists on the DEAD table); enums (started_by +auto_custody; thread_type +caregiver — **column never existed**; activity source +trackable_event). AI (L473-505): custom-range compilation, pattern/gap highlighting ("No medication logged Thursday"), LiLa context = last 3 shifts + flags. Edge cases (L508-538): role-differentiated lockouts, multi-caregiver append-only, custody-transition 5-min grace, forgotten-shift auto-end (sched+30min/manual 12h), historical category-label denormalization, pagination. 5 caregiver_* keys (L542-552) — NONE registered.

## C. Schema gaps
trackable_event_categories/logs, shift_reports: absent. **conversation_threads.thread_type: column NEVER existed** — real architecture is conversation_spaces.space_type (no 'caregiver' value); PRD-27 predates the shipped PRD-15 three-level model (Convention #136). shift_sessions: exists, dead, 0 rows. special_adult_permissions: 0 rows unreachable. access_schedules: 0 rows, no writer. 5 caregiver keys unregistered. Old shift_schedules table cleanly absent (superseded per #26).

## D. Layer analysis (combined-vs-split)
**Layer 1 (foundation/bug-fix):** split-brain fix (rewire all readers to time_sessions; retire dead table); shell decision (pre-shell /caregiver redirect vs 6th ShellType); shift-scoped kid-visibility hook; schedule-config write UI; vocabulary reconciliation + keyWiringStatus entries; mount ShiftView + the missing Log Activity form; un-hide Hub grid.
**Layer 2 (PRD-27 content):** trackable events (S4+S1), Kid View (S2 — mostly reuse + tagging), co-parent mode (S3), reports (S5 — dedicated EF), messaging (S6 — needs space_type reconciliation). Natural boundary: Layer 1 makes PRD-02's promise real; Layer 2 is PRD-27's new value. Cheapest/highest-value L2 slices first: S4 + S2.

## E. Conflicts (named)
1. #274: keyWiringStatus has zero SA keys to flip — registry needs additions, not toggles.
2. **#40 vs live code:** usePermission + PermissionHub hard-code the legacy shift_sessions table — in-code contradiction of the ratified convention.
3. #16 nav parity vs PRD-27's "no sidebar/no drawers" — N/A-by-design ratification needed (admin precedent).
4. PRD-28 money exclusion is accidental (role-string side effect) — needs explicit protection.
5. #273 two-door vs SA email-invite path — unverified; family-door roster exposure question.
6. PRD-27 messaging targets a nonexistent column; space_type has no caregiver slot.
7. View-As: caregiver surface needs modal mapping (Play-shell precedent from KIDS-REWARDS S2).
8. **STUB:85 "Special Adult Shift View ✅ Wired" is materially misleading** (unrouted + missing form + data never reaches mom).

## F. Open questions (absorbed into pack decisions)
Shell architecture; one build vs two; SA auth path + roster exposure; messaging space_type vs direct-reuse; shift_sessions table fate; canonical vocabulary + notes_instructions fate; Log Activity layer placement; mom's shift-history surface home (FO precedent).
