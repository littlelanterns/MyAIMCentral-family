# Wiring Status — End-to-End Routing

> Tracks which RoutingStrip destinations actually work vs stub.
> Updated each build session. Last updated: 2026-06-10 (RR-DEPLOY-SCOPING close-out; same-day as FO-COMMAND-CENTER).

## RR-DEPLOY-SCOPING (2026-06-10)

Review & Route / MindSweep direct deploy + task assignment scoping + family-device write restoration. Founder-approved same day; Convention #276; migrations 100262-100264; E2E `tests/e2e/permissions/task-assignment-scoping.spec.ts` 8/8 + `tests/e2e/features/review-route-direct-deploy.spec.ts` 1/1 + regression (leak-pass + permissions-wiring) 24/24.

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| Review & Route → tasks DIRECT deploy | Approved task cards become real `tasks` rows (assignee = routing user, source='review_route') via shared engine. Card review = the HITM step; queue = unreviewed intake only. | **Wired** | Was: every task card dumped into studio_queue for a second per-item review (origin bug: dad's 11 approved tasks). |
| Review & Route → list DIRECT deploy | Which-list drill-down on the List tile (`dynamicSubOptions` on RoutingStrip — user's lists) → `list_items` insert; no pick → shopping-list fallback → queue fallback. | **Wired** | |
| Review & Route summary toast | Route All reports "N tasks added to your Tasks · N sent to your Queue" (+ failure counts; failed items stay pending). | **Wired** | |
| MindSweep auto-route task/list direct | `routeDirectly` task/list branches use the shared engine (source='mindsweep_auto', new tasks_source_check value). always_ask + low-confidence queue paths unchanged. Calendar/agenda/recipe still queue. | **Wired** | Closes "autopilot promised automation it never delivered for tasks/lists." |
| `deployQueueItem()` shared engine | `src/lib/queue/deployQueueItem.ts` — task/list creation with sensible defaults, never-throws per-item outcomes, marks studio_queue rows processed. | **Wired** | FO-COMMAND-CENTER wires the Queue "Deploy all" button on it (sequenced, their table). |
| `task_assignment` grant — single authority for assigning NEW tasks | `util.task_assign_allowed()` + `useAssignableMembers()` TS mirror. Mom: all; additional_adult: self + granted kids (per-kid AND family-wide NULL-target rows; per-kid wins incl. 'none' carve-out); teens: self only. | **Wired** | Acting on EXISTING tasks stays on contribute-level `viewableLevels` (FO Q1 boundary). |
| Assignee picker scoping (6 surfaces) | AssignmentSelector (internal), TaskCreationModal (create+edit; Everyone pill + Whole Family mom-only), RoutineDeployModal, SequentialCreatorModal, GuidedFormAssignModal, ActivityListWizard. SharedTaskListWizard verified: no task inserts. | **Wired** | Was: every adult AND teen saw the full family roster as assignable. |
| Tasks/task_assignments WRITE-side RLS | WITH CHECK on assignee targeting (tasks INSERT/UPDATE, ta INSERT granted path); shared-task update policy tightened against assignee redirect; 100152 ta set preserved (100263 corrective). | **Wired** | E2E probes against production RLS. READ-side stays deferred (Convention #39). |
| Permission Hub: Assign-tasks grant rows | Family-wide binary Off/Allowed row in Family Management + per-kid row with inheritance note. Profiles NEVER touch the key (`apply_permission_profile` exclusions, migration 100264). | **Wired** | |
| Family-device write restoration | `util.is_family_shadow_of()` additive policies on tasks, task_assignments, task_completions, routine_step_completions, intention_iterations, family_intention_iterations, lists, list_items. | **Wired** | Pre-existing regression: two-door family-shadow sessions were silently RLS-blocked from ALL these writes (pre-two-door hub devices rode mom's session). Kid identity on family devices = app layer (PIN-verified member_session). |
| Family-device write audit — remaining tables | journal_entries, victories, widget_data_points, practice_log, messages, etc. under family-shadow sessions | Stub | Follow-up in STUB_REGISTRY — same fix pattern where confirmed needed. |
| Tasks/Lists READ-side RLS | DB-level read scoping | Stub | Unchanged — Convention #39 per-member-auth migration point. |

## FO-COMMAND-CENTER (2026-06-10)

Family Overview becomes mom's command center; Tasks page becomes purely personal. Founder vision 2026-06-09, gate-approved 2026-06-10 (Q1–Q9). Convention #275; #150 amended. Zero migrations. E2E `tests/e2e/family-overview/fo-command-center.spec.ts` 9/9 (+ updated leak-pass + permissions-wiring pins — relocated surfaces, same intents).

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| FO page tabs (Overview / Approvals / Queue / Finances) | Tabs on Family Overview; Queue + Finances mom-only; deep link `?view=family_overview&fotab=` | **Wired** | Queue mounts the REAL `SortTab` (modal contract #66/#146 untouched) |
| FO Routines section | `get_member_day_obligations` per member (Convention #271) + step completions; shared routines count any completer (#266) | **Wired** | New section key; saved orders merge via `mergeSectionOrder` (read-time) |
| FO Sequential section | Per-member collection progress + "Next:" item | **Wired** | New section key |
| FO Victories section (was stub) | `victories` today via family-timezone date | **Wired** | Founder Q9 |
| FO Weekly Completion section (was stub) | `useActivePeriod` + `calculate_allowance_progress` (default pool): % bar + on-track payout | **Wired** | Founder Q9. Multi-pool kids show default pool only (compact surface) |
| Member spot-check deep view | Tap column header → `MemberSpotCheck` modal: My Tasks / Routines / Opportunities / Sequential tabs, inline complete (credits the kid, no unmark per PRD-14C D8), full edit modal inline | **Wired** | Founder Q4 "no page hopping" |
| Shared task-edit flow | `useTaskEditor` + `TaskEditModal` — ONE save path (atomic RPC, ROUTINE-SAVE-FIX) for Tasks.tsx + spot-check | **Wired** | Extracted from Tasks.tsx |
| PendingApprovalsSection relocated to FO | Shared component `src/components/tasks/PendingApprovalsSection.tsx`; mastery fork (#161) + Decision 9 view-only gating intact | **Wired** | Off the Tasks page entirely (founder Q1) |
| Queue surface relocated to FO | FO Queue tab = `SortTab`; dead inline QueueTab (no-op Configure) deleted; QueueBadge/QuickTasks modal entry points unchanged | **Wired** | Founder Q1 |
| Finances relocated to FO | `FinancesTab` on FO; legacy `/tasks?tab=finances` redirects | **Wired** | Founder Q7 |
| Sequential [+ Create] relocated | Spot-check Sequential tab → SequentialCreatorModal (mom) | **Wired** | Founder Q8; Convention #150 amended; Studio + Lists entries unchanged |
| Tasks page purely personal | Own items only every role (incl. soft-claim-held §4.5); pill bar removed; Guided two-tab experience untouched | **Wired** | Leak-pass test 1/3 pins updated to the new homes |
| 13 views on Tasks page | Exported `ViewRenderer`/`ViewCarousel` (one renderer, two hosts); simple_list keeps segment-aware TaskList (Build M) | **Wired** | Founder Q6. 6 views remain PlannedViewStub (unchanged scope) |
| Inclusion control (Q2 hybrid) | Persisted default `dashboard_configs.preferences.task_view_inclusion` + session pills + "Save as default"; sequential = next-item-only, tap → full collection modal | **Wired** | `TaskViewInclusionControl.tsx` |
| Dad granted-scoped FO | PerspectiveSwitcher offers FO to additional_adult only with viewable members; FO filters by `viewableIds`; act-paths contribute+ w/ toast; stale `view_as_permissions` read removed | **Wired** | Founder Q3. Spot-check create inherits the born-scoped AssignmentSelector (REVIEW-ROUTE session, migrations 100262-100264) |
| FO FeatureGuide + LiLa knowledge | `family_overview` guide card; help-patterns + feature-guide-knowledge updated | **Wired** | |
| "Deploy all" button on Queue surface | Button in SortTab (modal Sort tab + FO Queue tab share it) loops `deployQueueItems()` engine per pending item; calendar/agenda/context-needing items skipped by the engine (CalendarTab Approve All keeps dates); results toast "N deployed · N left for details" | **Wired** | Engine landed mid-session (REVIEW-ROUTE migrations 100262-100264); E2E test 3b |
| FO Finances for finance-granted dads | FO Finances tab stays mom-only this build (parity with prior Tasks-page gating); granted dads keep Prize Board | Stub | Candidate follow-up: gate by `useManagementGrants.financeMaxLevel` |
| FO per-column long-press collapse override + drag reorder (PRD-14C) | Row-level collapse works; per-column override + section/column drag-reorder remain unbuilt from the original PRD-14C build | Stub | Pre-existing gap, unchanged by this build |

## PERMISSIONS-WIRING (2026-06-09)

Permission Hub wiring audit + dad finance/management access + per-member sidebar layer. Founder-gated; Convention #274; migration 100260; E2E `tests/e2e/permissions/permissions-wiring.spec.ts` 12/12 + leak-pass regression 10/10.

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| keyWiringStatus registry | Single source of truth for active vs inactive permission keys; consumed by Hub grid + teen panel | **Wired** | `src/lib/permissions/keyWiringStatus.ts` |
| Dad finance access (`financial_tracking` per-kid grants) | view = ledger read / contribute = + Mark Paid / manage = + Allowance tab. RLS granted paths on `financial_transactions`, `loans` (read), `allowance_periods` (manage UPDATE) | **Wired** | Migration 100260. Append-only preserved. Loan creation + allowance config stay mom. |
| FAMILY-WIDE finance grant (one row covers all kids, incl. future kids) | NULL-target `financial_tracking` row; per-kid rows win as exceptions (incl. 'none' carve-out). `util.finance_grant_level()` resolves effective level for RLS; `useViewableMembers` mirrors it; Hub "Finances & Prize Board — whole family" picker in Family Management + per-kid inheritance note | **Wired** | Migration 100261 (founder-approved 2026-06-09). E2E test 2b proves both-kids coverage + carve-out. |
| Balance tab "By child / By date" arrangement (all-kids view) | LedgerView all-kids mode gains an Arrange toggle: By child (default) = per-kid sections in roster order with color header, current balance, newest-5 preview + per-kid Show all; By date = the original chronological stream. Choice persists (localStorage) | **Wired** | Founder request 2026-06-09 ("messy and overwhelming"). E2E test 11b. |
| Granted management surfaces (Studio / Prize Board / RewardRules) | Family-wide grants (`target_member_id IS NULL`) for studio/reward_rules; Prize Board follows per-kid finance grants. `<GrantedRoute>` + sidebar entries appear only when granted | **Wired** | Default unchanged: invisible + Parent-only card for ungranted dads. |
| Payment attribution + mom notification | `useCreatePayment` records actor in description + metadata; quiet in-app notification to mom when actor isn't mom | **Wired** | Fire-and-forget; never blocks payment. |
| Per-member sidebar layer | `useResolvedFeatureAccess` (mom's Hub toggles) + `useManagementGrants` feed `getSidebarSections(shell, options)`; Sidebar + BottomNav + ViewAsModal pass identical options | **Wired** | Mom FROZEN; guided/play untouched. Dads with applied Balanced profiles now correctly lose Journal/InnerWorkings (mom's configured state). |
| View-vs-Contribute enforcement | `viewableLevels` on useViewableMembers; Tasks completion/approvals + Lists item-checks require contribute+; view = see only | **Wired** | Toast feedback (AdultShell now has RoutingToastProvider — was a silent noop for ALL adult toasts). |
| Archives grant scoping (`archives_browse`) | Member cards + detail-URL reach scoped via useViewableMembers | **Wired** | Display-layer (archives RLS is family-read by design). |
| Permission Hub honesty pass | Fake Family-Wide Rules card removed; dead per-kid rows removed (calendar/routines/lila/vault/messages/requests/higgins); growth rows marked inactive; SA per-kid grid hidden; Finances row + Family Management section added; no-row personal toggles display role default | **Wired** | Hub never offers a dead control. |
| Teen What's Shared panel (PRD-02 Screen 4) | Mounted in teen Settings; reports EFFECTIVE visibility via the registry (unenforced restrictions show pending marker, not a false ✗) | **Wired** | Was built-but-unmounted since the PRD-02 build. |
| Mom self-restriction ENFORCEMENT | Restrictions saved + displayed (inactive) but no surface enforces them | Stub | Needs target-aware filtering on mom-side journal/stars/intentions/innerworkings surfaces. |
| Special Adult Experience (ShiftView mount, SA sidebar, shift-gated access) | ShiftView (PRD-02 Screen 6) still unmounted; SA gets full adult shell | Stub | Filed: `claude/follow-up-builds/special-adult-experience.md`. SA Hub grid hidden until then. |

## Family-Auth-Two-Door (2026-06-09, Phases 1-4)

Two-door umbrella login model (PRD-01/PRD-02 amendment, founder-approved 2026-06-09). E2E: `tests/e2e/features/family-auth-two-door.spec.ts` — 8/8.

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| Roster enumeration sealed | `lookup_family_by_login_name` + `get_family_login_members` gated to authenticated family members; EXECUTE revoked from anon | **Wired** | Was a live prod hole — anyone could harvest member names/avatars by guessing family names. Migration 100251. |
| Family password door | `verify_family_login(name, password)` — combined check, byte-identical failures (no enumeration), roster released ONLY on verified password, 5/15 lockout | **Wired** | Migrations 100252-100253. Set/change via family-auth-admin Edge Function (`setFamilyPassword`), Settings → Family Password, forced one-time setup modal in MomShell, `npm run family:password` script. |
| Choice screen (two resting places) | Post-door: Hub tile → family device rests on /hub; name+PIN/picture → that member's personal device (real session) | **Wired** | FamilyLogin.tsx. Mom's tile always routes to her email sign-in (Decision 5). |
| Family identity | Per-family shadow account (`{family_id}@family.myaimcentral.app`) + hidden `family_members` row (`role='family'`) — first-class identity with own permission scope; future hub config hangs off it | **Wired** | Migrations 100254/100256/100257. Hidden from all rosters (central hook filter + 7-file sweep + dashboard_enabled=false). RoleRouter redirects family sessions to /hub. Self-healing provisioning via `family_door_sync` on first login. |
| Kill switch | Changing the family password rotates the shadow account + global sign-out → every resting family device bounced to the door | **Wired** | E2E test 7 exercises the full pipeline. Mom's remote answer to a lost device. |
| Picture password (single-picture) | Kid's ONE secret picture among 8 FIXED decoys; tap verified server-side (`verify_member_picture_password`, 5/15 lockout); correct answer never reaches the browser; session minted via server-derived HMAC secret | **Wired** | Migration 100258. Replaces the client-side 4-picture SEQUENCE (which downloaded the answer to the browser). Mom sets via Family Members image icon (PictureModal incl. "No login needed"). Hub dip-in supported (verify-only mode). Email-linked members route to email sign-in. |
| PIN login account creation | PIN set (PinModal) + family setup auto-PINs now call `ensure_pin_shadow_account` | **Wired** | Closes the historic FamilyMembers.tsx:428 TODO — PINs verified but couldn't create sessions for new members. |
| Personal-device timeout → PIN relock (no family password re-entry) | — | Stub | Member inactivity timeout still fully signs out; kid re-enters the family password. Follow-up build. |
| 'None'-members direct resting session from choice screen | Routes to /hub for avatar dip-in instead | Stub | Refinement; safe behavior today. |

PRD-02 read-scoping enforcement: mom sees all; everyone else sees own + explicitly shared + mom-granted (`member_permissions`). Origin: founder report — dad saw mom's tasks/info.

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| `useViewableMembers(featureKey, forMember?)` | Shared hook: mom→all members, additional_adult→self + non-`none` grants, others→self. View-As-aware via `forMember`. | **Wired** | `src/hooks/useViewableMembers.ts`. Reuse on any page listing member data. |
| Tasks page scoping | Non-mom sees own + shared + created-by-me + granted assignees; pill bar limited to viewable members; deep-link `?member=` sanitized. Default filter = OWN member for every role incl. mom (founder: "my tasks page should be mine"). | **Wired** | Replaced `isMomOrDad` mom-equivalence. |
| Tasks PendingApprovalsSection scoping | Mom all; others own/created/granted only. | **Wired** | Was family-wide for everyone. |
| Lists page scoping | Non-mom: own + `list_shares` + granted members' lists. Shares now loaded in EVERY session (was View-As-only). | **Wired** | Also closes kids-on-PIN-sessions seeing all family lists. |
| Sequential collections scoping | `useSequentialCollections(familyId, visibleMemberIds?)` — visible iff ≥1 task assigned to viewable member. Applied on Lists page + Tasks Sequential tab. | **Wired** | Lookup-only consumers unchanged. |
| /finances/history mom-only | `<MomOnlyRoute>` + RLS `ft_scoped_read` / `loans_scoped_read` (migration 100255, applied + pg_policies verified). Mom family-wide; others own rows. | **Wired** | Was: any family member could read every child's full ledger. |
| studio_queue read scoping | RLS family-wide SELECT/UPDATE/DELETE narrowed to primary_parent (migration 100255). Own-rows path + cross-member INSERT (MindSweep routing) unchanged. | **Wired** | Was: dad/special adults could read mom's whole queue. |
| Shopping Mode scoping | `scopeToOwner` param — non-mom base query limited to owned lists; shared lists validated (shopping + include_in_shopping_mode) before merge. Mom family-wide. | **Wired** | Closes follow-up queue item 7 ("F"). Founder ruling: shopping lists NOT family-shared by default — mom shares the grocery list explicitly via ShareListModal. |
| Active timers explicit scoping | Non-mom query adds `.eq('family_member_id', me)`; mom keeps family view (RLS `ts_manage_primary_parent`). | **Wired** | Hygiene — RLS already enforced; code now honest. |
| Scoping test pin | `tests/e2e/permissions/role-scoping-leak-pass.spec.ts` — 10 browser tests vs Testworth family: mom default-own, dad self-only + granted path, lists, queue RLS, finance block, shopping mode, FAB, teen lists, mom regression | **Wired** | LEAKPASS-prefixed fixtures created/removed via service role. |
| MomOnlyRoute own-login enforcement | Guard blocks ANY non-mom data subject (View-As AND own-login direct URL) with the Parent-only card; neutral frame while member loads | **Wired** | Found by Playwright test #6 — previously dad/teens on own logins passed straight through to mom-only pages on typed URLs. Invisibility stays the primary layer. |
| member_permissions `granted_to` read (RLS) | Migration 100259 adds the missing `granted_to` predicate to `mp_select` | **Wired** | Found by Playwright test #3 — additional_adults could not read grants given TO them; the entire granted path (useViewableMembers, usePermission, meeting permission gates) silently returned empty. Pre-existing production bug. |
| Notepad/route list-picker parity | Write-destination list pickers (route-to-list) scoping audit | Stub | Follow-up doc Q4 residual. |
| Tasks/Lists RLS hardening | DB-level read scoping for tasks/lists tables | Stub | Convention #39 per-member-auth migration point. Display-layer scoping in place. |

## Embedding Pipeline Restoration (BUG-PASS-0609, 2026-06-09)

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| `embed` Edge Function cron invocation | `process-embeddings` cron (every minute) → `util.invoke_edge_function('embed')` → NULL-embedding poll across TABLE_CONFIG | **Wired** (was silently dead) | Function was deployed `verify_jwt=true`; every cron run 401'd `UNAUTHORIZED_INVALID_JWT_FORMAT` (Silent Tooling Failure Pattern #7). Redeployed `--no-verify-jwt` with in-code service-role bearer check (fire-painted-schedules pattern). Commit `d28b861`. |
| MindSweep embedding-first classification | `mindsweep-sort` → `classify_by_embedding` RPC across guiding_stars / best_intentions / self_knowledge / journal_entries / archive_context_items | **Wired** (was silently broken) | `archive_context_items.embedding` never existed → RPC errored on EVERY call → 100% of items fell to the paid Haiku path with zero telemetry. Migration 100250 added column + HNSW + trigger; 173/173 rows backfilled async; RPC verified returning matches. Structured logging added so this class can't hide again (Row 31 SCOPE-4.F1). |
| `ai_parse` per-site telemetry | `sendAIMessage` optional telemetry param → `ai-parse` logs `ai_parse:review_route` / `ai_parse:smart_list` / `ai_parse:meeting_action` to `ai_usage_tracking` | **Wired** | Other `sendAIMessage` call sites remain catchall (row 176 scope). |
| Messaging unread definition | `src/lib/messaging/unreadThread.ts` `isThreadUnread()` shared by sidebar badge + space list + thread list | **Wired** | NEW-DDD — badge and page can no longer disagree. 8-test pin. |

## Member-Day Obligations — Canonical Source (Convention #271, 2026-05-28)

New shared infrastructure: `get_member_day_obligations(member_id, period_start, period_end)` is the single canonical query for "what counts for a member on a given date." Backed by the internal Layer 1 predicate `obligation_active_for_member_on_date(task_id, member_id, date)` which honors painted rdates/exdates, until, dtstart, archived, created, and assignee. Migration `00000000100247`.

| Consumer | How It Works | Status | Notes |
|---|---|---|---|
| `get_member_day_obligations` (Layer 2 RPC) | One round-trip returns (date, source_type, task/section/step ids + pool/segment/extra-credit/homework grouping fields) per active routine step in the period | **Wired** | Populates `source_type='routine_step'` only this build; return shape carries future-source grouping fields. |
| `obligation_active_for_member_on_date` (Layer 1 predicate) | Atomic "is this task active for this member on this date" — mirrors `src/lib/tasks/recurringTaskFilter.ts` exactly, enforced by `tests/routine-day-state-invariant.test.ts` | **Wired** | Internal; called only by Layer 2 + the invariant test mirror. |
| `useRoutineWeekView` (Allowance History page) | Replaced inline task-filter + per-DOW day-walk with one `get_member_day_obligations` call; joins names + completions for the same `WeekViewData` shape | **Wired** | Painted-blind bug fixed — past-end-date painted routines no longer appear in the history denominator. |
| `calculate_allowance_progress` RPC | Routine denominator day-loop + completion counting now gate each day through Layer 1 (painted-aware), preserving all prior fairness logic | **Wired** | Fixes silent allowance erosion from expired painted routines. |
| `calculate-allowance-period` Edge Function (`countAssignedTasks`) | Routine portion of `total_tasks_assigned` aggregated from `get_member_day_obligations` by task_id; non-routine portion still direct-counted (grandfathered) | **Wired** | Deployed `--no-verify-jwt` (Convention #246, cron-invoked). |
| Backfill: 3 painted production rows | `recurrence_details.until = last(rdates)` set where missing (idempotent) | **Wired** | Verified 0 painted routines remain without `until`. |
| Orphan Kitchen Zone row (`c06c706c…`, assignee_id=NULL) | Archived by idempotent migration step | **Wired** | Verified `archived_at IS NOT NULL`. |
| Other measurement/reward surfaces (gamification, homework, victories, trackers, intentions, practice, non-routine task derivations) | Re-derive measurement logic inline | **Grandfathered (Convention #271)** | Listed in STUB_REGISTRY.md → "Member-Day Obligations — Grandfathered." Each MUST refactor to the RPC when next touched. |

## RoutingStrip Destinations

| Destination | Routes From | Creates Record In | Status | Notes |
|---|---|---|---|---|
| Calendar | Notepad, MindSweep, .ics import | `studio_queue` → `calendar_events` | **Wired** | Queue → CalendarTab approve/edit/skip + .ics file upload on /sweep |
| Tasks | Notepad, Review & Route | `studio_queue` (destination='task') | **Wired** | Queue → TaskCreationModal works |
| List | Notepad, Review & Route | Shows list picker | **Wired** | ListPickerModal in SortTab |
| Journal | Notepad, Review & Route | `journal_entries` | **Wired** | Routes to journal |
| Guiding Stars | Notepad, Review & Route, MindSweep | `guiding_stars` | **Wired** | PRD-06 built |
| Best Intentions | Notepad, Meeting, MindSweep | `best_intentions` | **Wired** | PRD-06 built |
| Victory | Notepad, Review & Route, MindSweep | `victories` | **Wired** | PRD-11 built |
| Track | Notepad | Widget data point | Stub | PRD-10 widget data routing not built |
| Message | Notepad | Opens composer | Stub | PRD-15 not built |
| Agenda (Touch Base) | Notepad, MindSweep, SortTab | `meeting_agenda_items` | **Wired** | MeetingPickerOverlay multi-select grid; MindSweep `agenda` classification; SortTab intercept |
| InnerWorkings | Notepad, MindSweep | `self_knowledge` | **Wired** | PRD-07 built |
| Optimizer | Notepad | LiLa Optimizer | Stub | PRD-05C not built |
| Ideas | Notepad, Review & Route | `lists` (type='ideas') | **Wired** | Creates list item in Ideas list |
| Backburner | Notepad, Review & Route, Meeting, MindSweep | `lists` (type='backburner') | **Wired** | Creates list item in Backburner |
| Note | Notepad | `journal_entries` (free_write) | **Wired** | Quick note |
| MindSweep | Notepad, /sweep | `studio_queue` + direct inserts | **Wired** | PRD-17B: embedding-first + Haiku classification |
| Acknowledge | Request accept | Notification only | Stub | PRD-15 not built |
| Skip | Meeting action | No record | **Wired** | Just dismisses |

## Studio → Feature Wiring

| Studio Action | Target | Status | Notes |
|---|---|---|---|
| [Customize] Task types (task/routine/opportunity) | TaskCreationModal | **Wired** | Opens modal pre-configured for type |
| [Customize] Sequential Collection | SequentialCreatorModal | **Wired** | PRD-09A/09B Studio Intelligence Phase 1 — previously silently broken (opened TaskCreationModal which created malformed rows). Now routes through `useCreateSequentialCollection`. |
| [Customize] List types | Navigate /lists?create=type | **Wired** | URL param auto-opens create modal |
| [Customize] Randomizer | Navigate /lists?create=randomizer | **Wired** | Studio URL path; also accessible directly via Lists page [+ New List] picker as of Phase 1 |
| [Customize] Guided Forms | GuidedFormAssignModal | **Wired** | Opens 2-step assign flow |
| [Customize] Trackers/Widgets | WidgetPicker + WidgetConfiguration | **Wired** | PRD-10 Phase A |
| My Customized: Deploy | TaskCreationModal | **Wired** | Opens modal from template |
| My Customized: Edit | TaskCreationModal | **Wired** | Opens modal for editing |
| My Customized: Duplicate | RoutineDuplicateChooserDialog → RoutineDuplicateTemplateDialog \| RoutineDuplicateDialog | **Wired** | Worker ROUTINE-PROPAGATION (2026-04-25, c4): single duplicate entry point per Convention #255. Chooser asks "What would you like to do?" → "Copy and Customize" (independent template, lands in My Customized) or "Assign Additional Member" (existing deploy flow). Non-routines keep shallow-copy path. |
| My Customized: Archive | Supabase soft delete | **Wired** | Sets archived_at |

## Routine Deployment & Propagation (Worker ROUTINE-PROPAGATION, 2026-04-25)

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| "Schedule to start later" toggle | Toggle in TaskCreationModal routine SectionCard, off by default; on reveals date picker | **Wired** | c2. Persists to `recurrence_details.dtstart` JSONB. Toggle-off silently writes `familyToday` (Convention #257 compliant via `fetchFamilyToday`). |
| Advance-start gating on dashboard | `recurringTaskFilter` hides routines whose `recurrence_details.dtstart` is in the future | **Wired** | c1. Both RRULE and per-section-frequency code paths covered. |
| Master-template edit confirmation | When mom edits a master with 1+ active deployments, modal names every affected family member ("This will update 3 active routines: Ruthie, Mosiah, and Gideon.") | **Wired** | c3. `MasterTemplateEditConfirmationModal`. Pre-check fires from both `handleSave` and `handleSaveToStudio`. 0-deployment path silent (toast only). |
| Overlap detection — backstop | Postgres trigger `prevent_overlapping_routine_assignments` raises `exclusion_violation` on overlap | **Wired** | c2.5. Migration 100176. Replaces strict unique index `tasks_unique_active_routine_per_assignee` from migration 100152. |
| Overlap detection — application warm path | `detectRoutineOverlap` pre-checks before insert; `RoutineOverlapResolutionModal` surfaces when found | **Wired** | c2.5. Three options: Replace / Keep both, adjust dates / Cancel. "Open existing routine" deep link. |
| Date-range overlap rule | `(existing.dtstart <= new.end_date) AND (existing.end_date >= new.dtstart)` with NULL end_date = +infinity | **Wired** | c2.5. Pure predicate `dateRangesOverlap` exported separately for cross-feature reuse. |
| Sequential non-overlapping deployments | Same template, same assignee, non-overlapping date ranges allowed | **Wired** | c2.5 founder D5 rescope. Summer routine + fall routine for same kid both legitimate. |
| "Scheduled to start" badge on Studio | `ScheduledStartBadge` size=full next to type pill on My Customized cards when ANY active deployment has future dtstart | **Wired** | c5. `useCustomizedTemplates` query computes earliest future dtstart per template. |
| "Scheduled to start" badge on Tasks page | `ScheduledStartBadge` size=compact below task title in TaskCard for routines with future dtstart | **Wired** | c5. Theme tokens only. |
| Post-save toasts | RoutingToastProvider success toast on every routine-template save path | **Wired** | c6. Five distinct variants. Anti-panic UX. |
| Master-template propagation contract | `task_template_sections` and `task_template_steps` propagate live via `template_id` join. Task-level fields snapshot. Past `routine_step_completions` survive structural edits. | **Wired** | c8. Convention #259 added to CLAUDE.md. |
| Shared `cloneRoutineTemplate` utility | `src/lib/templates/cloneRoutineTemplate.ts` — pure deep-clone, no task row insert. Reused by `RoutineDuplicateDialog` (clone-and-deploy) and `RoutineDuplicateTemplateDialog` (clone-only). | **Wired** | c4. Founder D6 Thread 1 — utilities live under `src/lib/templates/` for cross-feature reuse by future Workers 2/3/4. |
| Shared template UI under `src/components/templates/` | ScheduledStartBadge, MasterTemplateEditConfirmationModal, RoutineOverlapResolutionModal, RoutineDuplicateChooserDialog, RoutineDuplicateTemplateDialog | **Wired** | c2.5/c3/c4/c5. Cross-feature reuse-ready. |
| Lists template deploy | `useCreateList` hydrates `default_items` into `list_items` at deploy time (snapshot). `template_id` written. `ListDuplicateDialog` for copy-and-rename. | **Wired** | Worker 4 (2026-05-01). D-L1 snapshot, no propagation. |
| Shared routines (is_shared=true) completion UX | Anyone-can-complete + completer-color rendering + allowance credit to actual completer | **Wired** | Workers 2+3 (2026-05-01). Grayed-out steps for non-completers, multi-instance FIRST-N-COMPLETERS, mom re-attribution, cross-sibling edit authority (Conventions 266-270). |
| Shared routine week review | RoutineWeekEditPage shows all members' completions with completer colors. Falls back to 7-day window without allowance period. | **Wired** | Workers 2+3. "View this week →" entry point on shared routines. |
| Shared list claim semantics | `list_items.in_progress_member_id` tracks "I'm on it" claims. Cleared on check/uncheck. Member colors on claimed items. | **Wired** | Workers 2+3. Migration 100196. Convention 268. |
| Shared list mode selector | ShareListModal "Shared list" / "Individual copies" toggle. Individual mode creates per-member copies via `useDuplicateListForMembers`. | **Wired** | Workers 2+3. Convention 269. |
| Cross-Sibling Edit Authority | Shared items (routines + lists) are mom-edit-only. Edit buttons hidden for non-primary-parent. | **Wired** | Workers 2+3. Convention 266. |

## Routine Save Reliability (Worker ROUTINE-SAVE-FIX, 2026-04-26)

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| `routine_step_completions.step_id` ON DELETE SET NULL | Migration 100177 brings the FK into compliance with Convention #259. Step deletion no longer fails when completions reference it; orphaned completions retain `step_id=NULL`. | **Wired** | c1. All consumer call sites (`TaskCard`, `RoutineStepChecklist`, `GuidedActiveTasksSection`) filter NULLs out of their `Set<string>` so orphans never produce false-positive checkmarks on live steps. `RoutineStepCompletion.step_id` widened to `string \| null`. |
| Save-handler error toast | `TaskCreationModal.handleSave`, `handleSaveToStudio`, and `handleEditConfirm` all wrap `onSave` in try/catch. On reject: `console.error('Routine save failed:', err)` + error-variant toast ("Couldn't save changes. Please try again or contact support.") + modal stays open. | **Wired** | c2. Replaces silent try/finally that swallowed every save throw. |
| `UndoToast` error variant | `variant: 'success' \| 'error'` on `UndoToast` and `RoutingToastProvider`. Error variant uses error-token border, AlertTriangle icon, role='alert' / aria-live='assertive', 10s default dwell (vs 5s for success). | **Wired** | c2. All existing call sites preserved by default `variant='success'`. |
| `update_routine_template_atomic` RPC | Migration 100178 adds a SECURITY DEFINER function that performs the entire routine-template rewrite (UPDATE template + DELETE old sections/steps + INSERT new sections/steps) inside a single transaction. RLS check inside enforces caller's family ownership. Returns `{section_count, step_count}` jsonb. | **Wired** | c3. Eliminates partial-commit risk that motivated the silent-save bug. |
| Single rewrite path across call sites | `createTaskFromData.ts` editingTemplateId branch and `Tasks.tsx:handleEditTask` both call the RPC. Frequency-rule normalization (mwf, t_th, custom day sort/dedupe) lives in `src/lib/templates/serializeRoutineSectionsForRpc.ts` so the SQL stays simple and the mapping is unit-testable. | **Wired** | c3. Replaces two divergent inline rewrite chains that diverged on error handling (one threw, one swallowed). |
| Routine edit error surfacing | `Tasks.tsx:handleEditTask` now throws on UPDATE-tasks failure (was `console.error + return`) and on RPC failure. The c2 catch block in `TaskCreationModal` surfaces both via the error toast. | **Wired** | c3. Mom always sees what happened — no more silent saves. |

## Sequential Collections (PRD-09A/09B Studio Intelligence Phase 1)

| Capability | Entry Point | Status | Notes |
|---|---|---|---|
| Create from Studio | Studio → Sequential Collection [Customize] → SequentialCreatorModal | **Wired** | Phase 1 (2026-04-06). Before Phase 1 this opened TaskCreationModal and silently wrote a broken single-row task. |
| Create from Tasks → Sequential tab | Tasks → Sequential tab → [+ Create] → SequentialCreatorModal | **Wired** | Same modal as Studio. |
| Create from Lists page | Lists → [+ New List] → "Sequential Collection" tile → SequentialCreatorModal | **Wired** | Phase 1 cross-surface visibility — new entry point. |
| DB writes | `sequential_collections` row + N `tasks` rows with `task_type='sequential'`, `sequential_collection_id`, `sequential_position`, first `active_count` flagged `sequential_is_active=true` | **Wired** | Via `useCreateSequentialCollection` mutation. E2E verified in `tests/e2e/features/studio-intelligence-phase1.spec.ts`. |
| Visible on Tasks → Sequential tab | `<SequentialCollectionView>` renders expandable cards with progress, restart-for-another-student, archive | **Wired** | Revived from dead code in Phase 1. |
| Visible on Lists page | Inline tile in grid / list view with "Sequential" badge + `current_index/total_items` subtitle | **Wired** | Phase 1 dual access. Only shown on `filter='all'`. |
| Sequential detail view from Lists page | Back-button wrapper rendering `<SequentialCollectionCard>` | **Wired** | Phase 1 — uses exported `SequentialCollectionCard`. Card has its own expand/collapse. |
| `createTaskFromData` guard | Throws `Error` on `taskType='sequential'` | **Wired** | Prevents silent re-introduction of the broken path. |
| `TaskCreationModal` guard | Skips `initialTaskType='sequential'` with `console.warn` | **Wired** | Defensive layer above the guard. |
| Advancement modes (practice_count / mastery) | — | **Wired** | Build J (2026-04-06) |
| Linked routine steps — editor + persistence | — | **Wired** | Build J (2026-04-06) |
| Linked routine steps — dashboard rendering | RoutineStepChecklist expands inline with linked content from sequential/randomizer/task sources | **Wired** | GuidedActiveTasksSection + TaskCard. 2026-04-13. |
| `curriculum-parse` Edge Function | — | **Wired** | Build J (2026-04-06) |

## Studio Capability Tags (PRD-09A/09B Studio Intelligence Phase 1)

| Item | Status | Notes |
|---|---|---|
| `capability_tags: string[]` required on `StudioTemplate` type | **Wired** | Compile-time error if a future template forgets tags. |
| Tags populated on all 27 seed templates | **Wired** | Blank formats + examples across task, guided form, list, and randomizer categories. |
| Widget starter configs carry baseline tags | **Wired** | Adapter in Studio.tsx adds `['dashboard_display', 'at_a_glance', 'progress_visual', tracker_type]`. Phase 2 will replace with per-tracker-type tags. |
| Studio search bar rendering tags | — | Stub (Session 3 / Phase 2) |
| Use case category browse | — | Stub (Session 3 / Phase 2) |
| "Best for:" tagline + tag pills on cards | — | Stub (Session 3 / Phase 2) |
| "My Library" unified tab | — | Stub (Session 3 / Phase 2) |

## System Lists (auto-created per member)

| List | Type | Auto-Created | Routes From | Status |
|---|---|---|---|---|
| Backburner | `backburner` | Yes (auto_provision_member_resources trigger) | Notepad, Review & Route | **Wired** |
| Ideas | `ideas` | Yes (auto_provision_member_resources trigger) | Notepad, Review & Route | **Wired** |

## User-Created List Types

| Type | Create UI | Detail View | Type-Specific Fields | Status |
|---|---|---|---|---|
| Shopping | **Working** | **Working** | quantity, unit, sections | **Working** |
| Wishlist | **Working** | **Working** | URL, price, total | **Working** |
| Expenses | **Working** | **Working** | amount, category, total | **Working** |
| Packing | **Working** | **Working** | sections, progress | **Working** |
| To-Do | **Working** | **Working** | priority, promote to task | **Working** |
| Prayer | **Working** | **Working** | basic items | **Working** |
| Ideas | **Working** | **Working** | basic items | **Working** |
| Backburner | **Working** | **Working** | basic items | **Working** |
| Custom | **Working** | **Working** | flexible | **Working** |
| Randomizer | **Working** | **Working** | draw spinner, category filter | **Working** |

## Seed Data in DB

| Table | System Records | Example Records | Verified |
|---|---|---|---|
| task_templates | 8 blank formats | 7 pre-filled examples | Yes (API test) |
| task_template_sections | — | Morning Routine (3), Bedroom (3) | Yes (migration success) |
| task_template_steps | — | ~22 steps across routines | Yes (migration success) |
| list_templates | 7 blank formats | 4 pre-filled examples | Yes (API test) |
| guided_form_responses | Table exists | — | Yes (API test) |

## RLS Verification

| Table | Anon Read | Auth Read | Auth Write | Verified |
|---|---|---|---|---|
| task_templates (system) | Yes | Yes | No (correct) | Yes (API test) |
| list_templates (system) | Yes | Yes | No (correct) | Yes (API test) |
| lists | — | Owner + parent | Owner + parent | Yes (wishlist create test) |
| guided_form_responses | — | Family-scoped | Own records | Yes (empty query succeeds) |

## Quick Create Actions (Global "+" Button)

| Action | Opens | Status | Notes |
|---|---|---|---|
| Add Task | Navigate `/tasks?new=1` | **Wired** | TaskCreationModal in Quick Mode |
| Quick Note | Notepad drawer (mom) or `/notepad` | **Wired** | Via NotepadBridge context |
| Log Victory | Navigate `/victories?new=1` | **Wired** | Victory recording page |
| Calendar Event | Navigate `/calendar?new=1` | **Wired** | EventCreationModal on CalendarPage + CalendarWidget |
| Send Request | Opens Notepad (fallback) | Stub | PRD-15 request modal not built |
| Mind Sweep | Navigate `/sweep` | **Wired** | MindSweep capture: text, voice, scan, link, calendar import |

## Calendar Import (Phase 0)

| Path | How It Works | Status |
|---|---|---|
| Upload .ics file | Calendar button on /sweep → parse → studio_queue → CalendarTab approve | **Wired** |
| Screenshot event | Scan button → OCR → MindSweep classifies as calendar → CalendarTab | **Wired** |
| Paste event link | Link button → fetch + summarize → MindSweep classifies → CalendarTab | **Wired** |
| Type event details | Text → Sweep Now → MindSweep classifies as calendar → CalendarTab | **Wired** |
| Forward email (.ics) | Email forwarding → mindsweep-email-intake | Stub (DNS not configured) |
| Google Calendar API | OAuth → two-way sync | Not built (Phase 1 / post-MVP) |

## Task Breaker AI (PRD-09A)

| Feature | How It Works | Status | Notes |
|---|---|---|---|
| Text Mode — Quick | TaskCreationModal → TaskBreaker → `task-breaker` Edge Function (Haiku) → 3-5 subtasks | **Wired** | Family context + active task counts passed |
| Text Mode — Detailed | Same flow → 5-10 subtasks with descriptions | **Wired** | |
| Text Mode — Granular | Same flow → 10-20 micro-steps | **Wired** | |
| Subtask creation | Accepted subtasks → child `tasks` rows via `parent_task_id` | **Wired** | Created in `createTaskFromData` |
| Image Mode | Camera/upload → Sonnet vision → action steps as subtasks | **Wired** | Camera capture + file upload in TaskBreaker.tsx, multimodal message to task-breaker Edge Function (Sonnet when image, Haiku for text-only). 2026-04-13. |
| Standalone Modal | StandaloneTaskBreakerModal — type task name + description, break down, save parent+children | **Wired** | QuickTasks strip (Zap icon pill), also openable from AI Vault. 2026-04-13. |
| AI Vault Entry | Single "Task Breaker" vault item covering text + image modes | **Wired** | Migration 100132. No tier assignment (deferred post-beta). 2026-04-13. |
| QuickTasks Strip | Zap icon pill → opens StandaloneTaskBreakerModal | **Wired** | Between Tasks and MindSweep in action order. 2026-04-13. |

## Task Rotation Advancement (PRD-09A)

| Feature | How It Works | Status | Notes |
|---|---|---|---|
| Rotation config persistence | `createTaskFromData` writes `recurrence_details.rotation` JSONB + `task_assignments` with `rotation_position` + `is_active` when `rotationEnabled=true` | **Wired** | 2026-04-13. Members array, current_index, frequency, last_rotated_at all stored. |
| Rotation cron | `advance_task_rotations()` runs daily at 00:15 UTC via pg_cron. Finds tasks with elapsed rotation periods, bumps current_index (wrapping), flips is_active on assignments, updates assignee_id. | **Wired** | Migration 100133. Supports weekly, biweekly, monthly, custom (defaults to weekly). |
| Rotation UI | AssignmentSelector toggle + frequency dropdown (weekly/biweekly/monthly/custom) | **Wired** | Already existed — now the config actually persists. |

## Opportunity Claim Lock Expiration (PRD-09A)

| Feature | How It Works | Status | Notes |
|---|---|---|---|
| Server-side cron | `expire_overdue_task_claims()` runs hourly via pg_cron, releases expired claims | **Wired** | Sets status='released', released=true |
| Client-side backup | `useExpireOverdueClaims` sweeps on page load | **Wired** | Belt-and-suspenders with server cron |

## List Victory Mode (PRD-09B)

| Feature | How It Works | Status | Notes |
|---|---|---|---|
| Victory mode selector | 4-option segmented control (None / Per item / All done / Both) in list detail header | **Wired** | Shopping + generic list views, owner/parent only |
| Per-item victories | Checking a flagged item → victory with source='list_item_completed', idempotent | **Wired** | Checks for existing victory before creating |
| List-level victories | Last unchecked item checked → victory with source='list_completed' | **Wired** | Debounced per session |
| Per-item flag toggle | Trophy icon on each item, toggleable by owner/parent | **Wired** | Auto-flags all items when switching to item_completed or both |
| Auto-flagging on mode change | Switching to item_completed/both bulk-sets all items' victory_flagged=true | **Wired** | Mom can unflag specific items |
| Default by list type | randomizer → 'item_completed', everything else → 'none' | **Wired** | Frontend default in useCreateList |
| Celebration banner | "All done! Victory recorded!" on list completion | **Wired** | Auto-dismisses after 4 seconds |
| victory_flagged column | Per-item boolean on list_items, default false | **Wired** | Migration 100102 |

## Painted Calendar / Pick Dates (Worker 5, 2026-04-27)

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| "Pick Dates" frequency option | New radio option in UniversalScheduler alongside One-time/Daily/Weekly/Monthly/Yearly/Custom. Tap dates on a calendar grid. | **Wired** | Produces `schedule_type='painted'` SchedulerOutput with explicit `rdates`. |
| Per-date assignee mapping | When 2+ members assigned and Pick Dates active, each painted date gets member-color pill assignee buttons. | **Wired** | `PickDatesAssigneeEditor` component. `assignee_map` on SchedulerOutput. |
| Instantiation mode selector | "Each kid does their own" vs "Shared — anyone completes" segmented control. | **Wired** | `instantiation_mode` on SchedulerOutput. |
| Time-of-day window | Optional "Active from [time] to [time]" on painted schedules. | **Wired** | `active_start_time` / `active_end_time` on SchedulerOutput. |
| deed_firings table | Connector architecture event log. Stores `scheduled_occurrence_active` firings. | **Wired** | Migration 100180. Phase 3 inherits + adds contract evaluation. |
| Painted-day deed firing | Hourly Edge Function (`fire-painted-schedules`, cron :20) writes deed firings when painted days arrive per family timezone. | **Wired** | Idempotent via unique key. Convention #246 compliant. |
| lists.schedule_config | JSONB column for attaching painted/recurring schedules to lists. | **Wired** | Migration 100181. NULL = always active. |
| "Active today" badge on list cards | Display-only pill on Lists page grid/list views when a list has a schedule attached. Green "Active today" or gray "Scheduled". | **Wired** | No filtering/hiding — Phase 3 scope. |
| CalendarPreview painted mode | CalendarPreview day-click toggles painted dates (not RDATE/EXDATE) when `schedule_type='painted'`. | **Wired** | |
| `isDateActive()` helper | Checks if a specific date is active in any SchedulerOutput. Works for all schedule types. | **Wired** | Exported from `@/components/scheduling`. |
| Contract evaluation of deed firings | Phase 3 reads deed_firings and evaluates contracts → godmother dispatch | Stub | Phase 3 scope |
| List visibility gating by schedule | Lists hidden/filtered based on schedule active state | Stub | Phase 3 scope |
| Convert-to-recurrence detection | Detect weekly patterns in painted dates and offer RRULE conversion | Stub | Optional polish pass |

## Universal Capability Parity — Stage 2 (2026-04-30)

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| Victory on task completion | `useCompleteTask` creates `victories` row when `task.victory_flagged=true` via `createVictoryForCompletion` | **Wired** | 4 paths: useCompleteTask, useApproveTaskCompletion, useApproveCompletion, useApproveMasterySubmission |
| Shared routine completion attribution | Routine step completion uses member-color badges + "done by [Name]" text. `SharedWithHeader` shows shared assignment indicator. | **Wired** | `routine_step_completions.member_id` credits actual completer |
| Shared list completion attribution | List item check uses `checked_by` for member-color display | **Wired** | Member color rendered via `useMemberColor` |
| Soft-claim visibility on task cards | "In progress by [Name]" badge on `track_progress=true` tasks with `in_progress_member_id` set | **Wired** | Opportunity items show per-item attribute badges (reward, claim lock, advancement) |
| Allowance actual-completer pipeline | RPC uses `task_completions.family_member_id` (not `tasks.assignee_id`). Edge Function display count includes `task_assignments`. | **Wired** | Stage 1 migration 100190 + Stage 2 Edge Function fix |

## Universal Capability Parity — Stage 3 (2026-05-01)

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| Content edit timing — Now/Next cycle | Mom chooses whether edits apply immediately or stage for next cycle. `pending_changes` table stages changes; cron auto-applies scheduled ones. | **Wired** | Migration 100192 (table), 100193 (cron). Routines: schedule_activation. Lists/sequential: manual_apply. |
| Routine Now/Next modal | `MasterTemplateEditConfirmationModal` extended with Now/Next segmented control. Type-aware defaults (display→Now, structural→Next). | **Wired** | Worker 2. Staging intercept in `handleEditConfirm` + save-to-studio. |
| List Now/Next modal | `NowNextChoiceModal` shared component. Intercepts capability edits on shared lists via `handleSharedListEdit`. | **Wired** | Worker 3 + gap fix. Tracking defaults + victory mode routed through handler. |
| Sequential Now/Next modal | `NowNextChoiceModal` on SequentialCollectionView. Per-item advancement edits pass through `onStagedEdit` prop. | **Wired** | Worker 3 + gap fix. |
| PendingChangesBadge | Self-hiding badge on Studio template cards, list cards, sequential collection cards. | **Wired** | Shows "N pending" when count > 0. |
| PendingChangesSummary | Collapsible inline section in TaskCreationModal for routine editing. Per-item cancel + apply-all. | **Wired** | Worker 2. |
| Apply Pending Changes banner | Banner on list detail + sequential detail views with "Apply now" button. | **Wired** | Worker 3. Calls `useApplyPendingChanges`. |
| Cron auto-apply | `util.apply_scheduled_pending_changes()` runs hourly at :15. Dynamic SQL for generic apply. | **Wired** | Migration 100193. Handles all 7 source types. |
| Family Overview bug fix | Null-due-date tasks filtered to 7-day window + not-completed + `isRecurringTaskVisibleToday`. | **Wired** | `useFamilyOverviewData.ts:59`. |
| LiLa drawer default closed | `MomShell.tsx` `_lilaVisible` defaults to `false` instead of `true`. | **Wired** | UX fix. |
| FeatureGuide disabled | `FEATURE_GUIDES_DISABLED = true` constant guards render + effect. | **Wired** | Temporary. Flip to `false` to re-enable. |

## BookShelf Fix Session (2026-05-01)

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| Optimistic extraction item mutations | `useExtractionItemActions` updates local state via `updateItemLocally` instead of full refetch. Scroll position preserved. | **Wired** | Worker 1. Heart was already optimistic; note/delete/send-to now match. |
| Reading position persistence | `useBookReadingPosition` hook saves scroll + tab to `bookshelf_member_settings.reading_positions` JSONB (debounced 2s). Restores on mount. | **Wired** | Worker 1. Migration 100194. |
| Study Guide flash fix | `StudyGuideLibrary` keeps existing data visible during background refresh instead of resetting to empty. | **Wired** | Worker 2. 3 reports (Apr 3, Apr 3, Apr 26). |
| Study Guide generation feedback | Phase-based progress, "View Study Guide" button on success, zero-items explanation, specific error messages. | **Wired** | Worker 2. |
| Study Guide View As scoping | `audienceKey` uses `effectiveMember.id` via `useViewAs()` instead of always using mom's ID. | **Wired** | Worker 2. |
| Study Guide error handling | `count_extractions_by_audience` RPC call has try/catch with retry button UI. | **Wired** | Worker 2. |
| Morning Rhythm book links | `MorningInsightSection` links to `/bookshelf?book_library=ID`. `BookShelfPage` + `ExtractionBrowser` resolve `book_library_id` → `bookshelf_item_id`. | **Wired** | Worker 3. Was navigating to non-existent route → black page. |
| GlitchReporterFAB z-index | Inline `zIndex: 9990` + `pointerEvents: 'auto'` on FAB. | **Wired** | Worker 3. |
| Crisis Override in bookshelf-discuss | `detectCrisis()` check before AI call in `bookshelf-discuss` Edge Function. | **Wired** | Worker 4. Triage row 6 (SCOPE-8b.F5). |
| Mode key dedup book_discuss | `book_discussion` deactivated, `book_discuss` canonical. Migration 100195. | **Wired** | Worker 4. Triage row 7 (NEW-A). |
| Heart/HeartOff LiLa indicator | BookShelfLibrary shows Heart + context level label based on `bookKnowledgeAccess` setting. | **Wired** | Worker 4. Triage row 179. |
| BookShelf → Tasks handoff | `handleTaskSave` now calls `createTaskFromData` + `handleMarkSentToTasks`. Was silently broken (empty handler). | **Wired** | Worker 5. Triage row 76 (SCOPE-3.F19 partial). |
| BookShelf → Notepad | `sendToNotepad` creates `notepad_tabs` with `source_type='bookshelf'`. | **Wired** | Worker 5. Feature request (Apr 9 report). |
| BookShelf → Messages | `sendToMessages` routes to `studio_queue` with `destination='message'`. | Stub | Worker 5. Actual delivery is PRD-15 scope. |
| BookShelf → Widgets | — | Stub | PRD-10 dependency. |
| BookShelf → BigPlans | — | Stub | PRD-29 dependency. |
| Study Guide Rework — Sonnet from chunks | `bookshelf-study-guide` Edge Function rewritten: reads chunks (old table → platform table fallback via `get_book_chunks_for_study_guide` RPC), uses Sonnet, UPDATEs `guided_text` + `independent_text` columns on existing `audience='original'` rows. Resume-safe (skips already-filled items). | **Wired** | Migrations 100197-100198. Verified on Lion, Witch & Wardrobe (395 items, 4 passes). |
| Audience Toggle (Adult/Teen/Kid) | `AudienceToggle` segmented control on `ExtractionBrowser`. Display-only — switches which column renders (`text`, `independent_text`, `guided_text`). Falls back to adult when NULL. | **Wired** | URL param `?audience=guided\|independent`. |
| Study Guide Library rework | Shows all extracted books with View/Generate buttons. No per-child scoping. `count_youth_text_by_book` RPC checks which books have youth text. | **Wired** | Replaced old `study_guide_{memberId}` approach. |
| Study Guide timeout/resume | Modal shows "Click Generate again to resume" on timeout. Edge Function filters to `guided_text IS NULL` so retries skip completed items. | **Wired** | 150s Edge Function limit means large books need 2-4 passes. |

## Phase 3 — Connector Layer (2026-05-03)

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| Contracts table | Central switchboard: deed addressing, IF logic (8 patterns), godmother routing, stroke_of timing, inheritance (3 levels), presentation mode | **Wired** | Migration 100199. 10 seeded contracts from existing configs. |
| Deed firings dispatch | AFTER INSERT trigger on `deed_firings` → `dispatch_godmothers` RPC → contract matching → godmother invocation | **Wired** | Trigger `trg_deed_firings_dispatch`. Idempotent via UNIQUE on grant log. |
| `fireDeed()` utility | Single deed-firing INSERT replaces old `rollGamificationForCompletion` + `awardOpportunityEarning` + `createVictoryForCompletion` at 5 hook sites + intention iterations | **Wired** | `src/lib/connector/fireDeed.ts`. Legacy code deleted. |
| allowance_godmother | Registers deed for allowance calculation at period close | **Wired** | Migration 100207 |
| numerator_godmother | Records above-and-beyond boost for Phase 3.5 computation | **Wired** | Migration 100208 (dispatch stub) |
| money_godmother | Awards dollars to kid's financial balance via `grant_money` RPC | **Wired** | Migration 100209. 14/14 Playwright verified. |
| points_godmother | Awards gamification points via `grant_points` RPC | **Wired** | Migration 100210. 14/14 Playwright verified. |
| creature_godmother | d100 roll against rarity weights → creature collection insert | **Wired** | Migration 100225. Seeded for all sticker-book-enabled kids. |
| page_unlock_godmother | Threshold check → unlock next sticker page | **Wired** | Migration 100225. Seeded for all sticker-book-enabled kids. |
| prize_godmother | IOU creation + optional reveal animation | **Wired** | Migration 100211. Entity↔event bridge for reveal lookup. |
| victory_godmother | Generic victory creation for any deed source | **Wired** | Migration 100212. `createVictoryForDeed` helper. |
| family_victory_godmother | No-op placeholder until PRD-11B | **Wired** | Migration 100213. Returns `status: 'no_op'`. |
| custom_reward_godmother | Text payload OR list reference delivery | **Wired** | Migration 100214. Handles inline + config modes. |
| assign_task_godmother | Template-based task creation from contracts | **Wired** | Migration 100215 |
| recognition_godmother | No-reward presentation-only contracts (e.g., coloring advance) | **Wired** | Migration 100216 |
| Presentation layer | ContractRevealWatcher in all 5 shells. Modes: silent/toast/reveal_animation/treasure_box/coloring_advance | **Wired** | `usePendingReveals` hook, Realtime subscription. |
| Contract authoring UI | `/contracts` page — 6-section CRUD form, inheritance visualization, delete/restore | **Wired** | Mom-only. Plan & Do sidebar. |
| Prize Board expansion | 3-tab layout: Allowance (unpaid periods, itemized breakdown, Mark Paid), Prizes (IOUs), Balance (running totals) | **Wired** | `/prize-board`. Mom-only. |
| Feature flag | `families.allowance_dispatch_via = 'connector'` for instant legacy rollback | **Wired** | Migration 100202 (column), 100219 (flipped). |
| compute_streak RPC | Consecutive-day counting from deed_firings with grace days | **Wired** | Migration 100204. Used by streak IF pattern. |
| Cron infrastructure | `:25` weekly (end_of_week contracts), `:30` hourly (end_of_day + lifecycle sweep) | **Wired** | Migration 100205. Convention #246 compliant. |
| Deferred grants | Queue for non-immediate stroke_of values | **Wired** | `deferred_grants` table. |
| Contract grant log | Append-only audit trail + presentation tracking | **Wired** | `contract_grant_log` with UNIQUE idempotency. |
| Allowance dispatch audit | Dual-logging for migration verification | **Wired** | `allowance_dispatch_audit` table. |

## Multi-Pool Allowance (Phase 3.5)

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| Multi-pool configs per kid | `allowance_configs` one row per (member, pool_name). Default pool = `'default'`. | **Wired** | Migration 100234. |
| Per-pool `allowance_periods` | One period row per pool per member. `pool_name` column on `allowance_periods`. | **Wired** | Migration 100234. |
| Per-pool RPCs | `calculate_allowance_progress(pool_name)`, `get_pool_progress`, `calculate_weighted_combination` | **Wired** | Migration 100235. |
| Per-pool widget display | AllowanceCalculatorTracker shows per-pool breakdown when 2+ pools, single-pool unchanged | **Wired** | Worker D1. |
| PoolDetailModal | Tap pool name on widget → modal with per-pool progress, weight, contribution | **Wired** | Worker D1. |
| ChildAllowanceConfig multi-pool | Pool list, "+ Add Pool", expand cards, overage cap, term dates, lifecycle buttons | **Wired** | Worker D1. |
| ChildAllowanceConfig single-pool backward compat | No pool list visible for single-pool kids, "+ Add another pool" entry point at bottom | **Wired** | Worker D1. |
| BulkConfigureAllowanceModal pool selector | Pool name dropdown + "Add pool to all selected" | **Wired** | Worker D1. |
| Pool lifecycle UI (pause/archive/activate) | Confirmation prompts, status badges on widget, paused excluded from combined | **Wired** | Worker D1. |
| Edge Function per-pool period close | `calculate-allowance-period` creates per-pool periods, computes weighted combination, writes `pool_contribution` informational transactions | **Wired** | Migration 100236. Worker C. |
| Cross-pool penalty/multiplier at period close | Contracts with `multi_pool_threshold` IF pattern evaluated at period close | **Wired** | Worker C. |
| Full earnings ledger | Balance tab: kid pills, per-kid + all-kids view, running balance, pool_contribution rows, category + pool filters | **Wired** | Worker D2. LedgerView.tsx. |
| PaymentModal wiring fix | Pay button opens PaymentModal (was hardcoding full balance) | **Wired** | Worker D2. PrizeBoard.tsx. |
| Compute-then-prompt recalculate | `computeMultiPoolRecalc` (no writes) → NegativeRecalculateModal (3 options) → `applyMultiPoolRecalc` | **Wired** | Worker D2. Key Decision 16. |
| Grace day sync across pools | `useAddGraceDayForMember` / `useRemoveGraceDayForMember` updates ALL active pool periods | **Wired** | Worker D2. D-gap-2. |
| Period history pool grouping | `useGroupedPeriodHistory` groups by (period_start, period_end), per-pool breakdown in Allowance tab | **Wired** | Worker D2. D-gap-3. |
| Kid-visible ledger | LedgerView mode='self', respects `child_can_see_finances`, Play shell hides money | **Wired** | Worker D2. |
| `pool_name` on `financial_transactions` | Source tracking for per-pool earnings, adjustments, payments | **Wired** | Migration 100234. |
| `combined_percentage` on `allowance_periods` | Weighted combination stored on period (report card), not on config (rulebook) | **Wired** | Key Decision 15. |
| Cross-pool condition authoring UI | Dedicated inline UI in ChildAllowanceConfig | Stub | D-gap-4. Mom uses `/contracts` page. |
| Goal-based pool UX | `pool_type='goal_pool'` schema columns exist, no frontend | Stub | Post-MVP. |
| Self-managed pool ownership UX | `pool_owner_member_id` schema exists, no frontend | Stub | Post-MVP. |

## View-As Identity-Scope Architecture (2026-05)

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| `useEffectiveMember()` / `useEffectiveShell()` / `useEffectiveViewer()` hooks | Return the data-subject (and their shell) inside the View-As modal scope; fall back to `useFamilyMember()` / `useShell()` outside it. `useFamilyMember()`'s 119 callers untouched. | **Wired** | Worker 1. `src/hooks/useEffective*.ts`. ~27 page-level consumers migrated (Workers 3+4). |
| `view_as_sessions.origin` column | `'mom_viewing' \| 'member_session'` with `DEFAULT 'mom_viewing' CHECK(...)`. Distinguishes mom-initiated vs hub-PIN flows for audit + close behavior. 394 existing rows backfilled. | **Wired** | Worker 1. Migration `00000000100246`. Both values DB-verified in production by 5D Playwright runs. |
| `<MomOnlyRoute>` backstop | SECONDARY enforcement — renders a friendly blocked card (origin-aware copy, Lucide Lock icon) when a non-mom data subject reaches one of 16 mom-only routes by direct URL/deep-link. PRIMARY enforcement is sidebar invisibility. | **Wired** | Worker 4. `src/lib/permissions/MomOnlyRoute.tsx`. 16 routes guarded in `App.tsx`. |
| `filterKidPrivate()` helper | Pure helper keyed on `origin`: hides Journal `visibility='private'`, self_knowledge `share_with_mom=false`, and `journal_entries(entry_type='lila_conversation')` from mom-via-View-As; visible to kid-via-hub. | **Wired** | Worker 5A. `src/lib/permissions/filterKidPrivate.ts`. Reflection privacy deferred (Follow-Up G); Safe Harbor stays feature-gated via `PRIVACY_EXCLUSIONS`/`PRIVACY_ROUTE_MAP`. |
| Hub PIN flow → modal-over-`/hub` | `HubMemberAuthModal` no longer `navigate('/dashboard')`; passes `origin='member_session'` to `startViewAs()`. Modal renders over `/hub`; close returns to `/hub`. | **Wired** | Worker 5B. Commit `d057a6d`. Origin-aware `ViewAsBanner` hides Manage Tasks + Switch in member_session (lateral-escalation gap closed, founder-confirmed KEEP). |
| `useViewAsTimeout` + warning banner | Modal-only 15-min inactivity timeout with a 2-min non-blocking warning banner + "I'm still here" reset. Separate from `useSessionTimeout`; does not touch mom's auth session. | **Wired** | Worker 5C. `src/hooks/useViewAsTimeout.ts`, `ViewAsTimeoutWarningBanner.tsx`. |
| My Rewards stub route + `show_my_rewards` toggle | `/my-rewards` (kid-facing `<ProtectedRoute>`) renders `<PlannedExpansionCard featureKey="my_rewards_page" />`. Sidebar entry gated by per-child `family_members.preferences.show_my_rewards` (default false, schema-less default-on-read). | **Wired (stub page)** | Worker 4. Feature key migration `00000000100248` (applied — registry 207→208). Real page content = Follow-Up Build A. |
| ErrorBoundary around ViewAsModal | New `src/components/shared/ErrorBoundary.tsx` wraps the modal-rendered shell/page (banner + Exit OUTSIDE the boundary). Keyed on `target.id:path` for auto-recovery. Any render crash degrades to a friendly card, never black-screens. | **Wired** | Cross-shell crash detour. Commit `939b730`. Permanent architecture improvement. |
| Hub-route ViewAsModal mount | `<ViewAsModal />` mounted in `src/pages/Hub.tsx` (HubPage uses `ProtectedRouteNoShell`, outside RoleRouter). `/hub` and shell routes are mutually exclusive → no double-mount. | **Wired** | Cross-shell crash detour. Commit `9d63b1f`. Permanent architecture improvement. |
| Realtime channel collision sweep | All 4 `postgres_changes` hooks (`useNotifications`, `usePendingReveals`, `useThreadRealtime`, `useSpacesRealtime`) made per-instance-safe (`useId()` channel name, `.on()` before `.subscribe()`, `removeChannel` cleanup). | **Wired** | Cross-shell crash detour. Commits `939b730` + `fa5f644`. Codified as Convention #272. |

## Known Issues / TODO

- LiLa help button in GuidedFormFillView is a stub (PRD-05 dependency)
- Guided Form child fill view + mom review flow not tested end-to-end
- Quick Create "Send Request" falls back to Notepad until PRD-15 is built
- Crisis Override still missing in `message-coach` and `auto-title-thread` Edge Functions (separate ticket, not BookShelf scope)
- Phase 1c (drop old per-family BookShelf tables) still pending — 30-day soak well past (Phase 1b was April 11)
- Old `bookshelf_chunks` table has 58K rows overlapping with `platform_intelligence.book_chunks` (56K rows) — cleanup deferred to Phase 1c
