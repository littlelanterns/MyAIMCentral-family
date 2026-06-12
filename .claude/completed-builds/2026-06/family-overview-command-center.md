# Completed Build: Family Overview Command Center (FO-COMMAND-CENTER)

## Status: COMPLETE — founder signed off 2026-06-12 ("I think we are good to finish off!"). 34 Wired / 0 Stubbed / 0 Missing. Pushed through 1f5bb00 (incl. the Vercel deploy repair + P0 RLS recursion fix, migration 100265).

> Originally gate-approved 2026-06-10 (all Q1–Q9 answered; Q5 order: Events → Tasks → Routines → Sequential → Opportunities → Best Intentions → Trackers → Weekly Completion → Victories). Six founder eyes-on additions landed same-session — see verification rows 26–34.

## Build phases

1. **FO sections + data** — add `routines`/`sequential` section keys + new default order (append-if-missing for saved orders); routines/sequential data hooks; wire Victories + Weekly Completion (allowance progress) sections live.
2. **Relocations** — FO gains page-level tabs [Overview] [Approvals] [Queue] [Finances]; PendingApprovalsSection extracted to shared component (mastery fork + canActOnTask intact); QueueTab + QueueItemCard extracted; FinancesTab mounted on FO; member spot-check expanded view with inline TaskCreationModal; Sequential [+ Create] relocated (Convention #150 amendment).
3. **Tasks page personal** — remove relocated tabs + member pill bar; add ViewCarousel/ViewRenderer; inclusion control (global default in per-member prefs + session override pills); sequential shows next-item-only, tap-through.
4. **Dad scoped FO** — PerspectiveSwitcher FO tab for additional_adult with viewable members; FamilyOverview swaps stale `view_as_permissions` for `useViewableMembers`; view-vs-contribute action gating; Queue stays mom-only (RLS); Finances per grants.
5. **Tests + close-out** — new Playwright suite; regression (leak-pass + permissions-wiring); tsc/lint; eyes-on verification; file updates + LiLa knowledge.

## Cross-session coordination (REVIEW-ROUTE-TASK-SCOPING, 2026-06-10)

See `COORDINATION-review-route-task-scoping.md` (answers appended). Agreed: their new
`task_assignment` grant + scoped AssignmentSelector is the single authority for
assignment scoping; my FO create path mounts TaskCreationModal and inherits it.
Act-on-existing stays `viewableLevels` contribute+ (mine, relocating with Approvals).
**Sequenced dependency: their scoped AssignmentSelector should land before my Phase 4
ships; fallback = FO per-kid create entry gated mom-only until it lands.** They take
migrations 100262+; I expect zero. Both stage only own files.

> Worker: FO-COMMAND-CENTER. Dispatch: `claude/dispatch-prompts/family-overview-command-center-session.md`.
> Vision (THE LAW): `claude/feature-decisions/Family-Overview-Command-Center-Vision.md`
> Feature decision file: `claude/feature-decisions/Family-Overview-Command-Center.md`

## Source material read (full documents)

- Vision file; PRD-14C; PRD-09A; PRD-17 (all full)
- Addenda: PRD-14 Cross-PRD; PRD-09A/09B Studio Intelligence; PRD-09A/09B Linked Steps/Mastery; PRD-09A Daily Progress Marking; PRD-17B Cross-PRD; PRD-Audit-Readiness; PRD-Template-and-Audit-Updates
- Completed builds: role-scoping-leak-pass.md; permissions-wiring.md (incl. PRD-31 Permission Matrix rulings)
- Code: FamilyOverview.tsx, useFamilyOverviewData.ts, useFamilyOverviewConfig.ts, Tasks.tsx, UniversalQueueModal.tsx (structure), DashboardTasksSection.tsx, Dashboard.tsx (FO mount + views), PerspectiveSwitcher.tsx
- Tool health (Convention #241): codegraph initialized this session ✓; endor-cli-tools connected ✓; mgrep not used (Convention #242)

## Pre-Build Summary

### What moves TO Family Overview
1. **Member spot-checking** — per-member deep view (today behind the Tasks member pill bar)
2. **Category sections per member column** — ADD `routines` + `sequential` section keys to the existing 7 (events, tasks, best_intentions, trackers, weekly_completion, opportunities, victories). Registered TEXT constants — no migration.
3. **PendingApprovalsSection** — relocated intact, INCLUDING the Build J mastery fork (Convention #161: `completion_type='mastery_submit'` → mastery hooks → flip to `'mastery_approved'` for the gamification RPC, Convention #200) and PERMISSIONS-WIRING `canActOnTask` view-vs-contribute gating.
4. **Queue surface** — the Tasks page inline Queue tab relocates. UniversalQueueModal 3-tab contract (Conventions #66/#146) and all modal entry points untouched.
5. **Category multi-select** — "all selected categories for all selected people" (extends `family_overview_configs`).
6. Member column scroll + member multi-select — ALREADY BUILT, keep.

### What the Tasks page becomes
- Purely personal: own items (incl. soft-claim-held per Daily Progress Marking §4.5) + prioritization views.
- NEW inclusion control: routines / opportunities / sequential viewable alongside tasks inside the views (display filter only — Convention #68, view metadata already on `tasks` rows).
- Tabs/sections that leave: Routines, Opportunities, Sequential, Queue (+ Approvals section). Finances tab fate = gate Q7.

### Known supersessions (document, newer-wins per Convention #11)
- Studio Intelligence addendum "Sequential tab dual access, not moved" → superseded by founder vision 2026-06-09.
- Convention #150 entry-point list amendment: Tasks → Sequential [+ Create] entry point follows the Sequential surface to FO.

### Schema / migrations
- **Expected: zero migrations.** Section keys are registered constants; preferences persist in existing JSONB columns. `family_overview` feature key already registered (migration 000009).
- If any migration becomes needed: check `npx supabase migration list --linked` FIRST (last known 100261), idempotent SQL, `npm run schema:dump` after.

### Stale code to correct in passing
- FamilyOverview dad-scoping reads `view_as_permissions` (pre-leak-pass). Replace with `useViewableMembers` (or remove if FO stays mom-only — gate Q3). Currently dead code: PerspectiveSwitcher is mom-only.

### NOT in scope
- Tasks/Lists RLS hardening (Convention #39); Reflections revamp; My Rewards content; Special Adult Experience; any reduction of the 13 prioritization views; new gamification/reward surfaces; the 6 PlannedViewStub views stay stubs; FO AI digest/forecast.

## Founder Decisions (gate answers, 2026-06-10)

| # | Decision |
|---|---|
| Q1 | **APPROVED** — Approvals + Queue surfaces move entirely off Tasks. QuickTasks strip queue-modal icon + QueueBadge entry points stay (modal ≠ page surface). |
| Q2 | **HYBRID** — Option B global default ("what counts as a task" setting) + Option A per-day override pills on the view header. **Sequential items in task views show ONLY the next item to be done**; tapping it (if allowed) opens the full list / complete-early etc. |
| Q3 | **YES** — dad gets a granted-scoped Family Overview: only the children he holds permission for, only what each grant allows. Via `useViewableMembers` + PerspectiveSwitcher gains the FO tab for granted additional_adults. Stale `view_as_permissions` read replaced. |
| Q4 | **APPROVED** — full TaskCreationModal opens inline inside the FO spot-check view. No page hopping. |
| Q5 | **Best Intentions moves next to Trackers** (sequential + opportunities are more timeline-bound, rank higher). Default order: Events → Tasks → Routines → Sequential → Opportunities → Best Intentions → Trackers → Weekly Completion → Victories. (Exact BI position — above Trackers — confirmed at gate recap.) |
| Q6 | **CONFIRMED** — ViewCarousel + ViewRenderer (the 13 views) added to the Tasks page; dashboard section unchanged. |
| Q7 | **Finances tab moves to Family Overview** (off Tasks). |
| Q8 | Walkthrough requested — pending founder confirmation (Sequential "+ Create" entry point relocation, Convention #150 amendment). |
| Q9 | **WIRE BOTH** — Victories section (live data) + Weekly Completion section (PRD-28 allowance progress RPCs). |

## Mom-UI Surfaces

- Family Overview (Dashboard → Family Overview perspective) — shells: mom (+ adult if Q3=yes) — heavy modification
- Tasks page — shells: mom, adult, independent (guided untouched) — heavy modification
- Dashboard PerspectiveSwitcher — shells: mom (+ adult if Q3=yes) — modification only if Q3=yes
- Sidebar/BottomNav — only if any nav entry changes (none expected; FO lives behind PerspectiveSwitcher) — parity check if touched

## Post-Build Verification (filled 2026-06-10 — awaiting founder eyes-on + sign-off)

| # | Requirement | Source | Status | Notes |
|---|---|---|---|---|
| 1 | Routines section per member column | Vision §2 / Q5 | **Wired** | Data via `get_member_day_obligations` (Convention #271); shared-completer counting (#266). E2E test 1 |
| 2 | Sequential section per member column (progress + next item) | Vision §2 | **Wired** | E2E test 1 |
| 3 | Victories section live | Q9 | **Wired** | Family-timezone today. E2E test 1 |
| 4 | Weekly Completion live (% + on-track payout) | Q9 / PRD-14C §5 | **Wired** | Default pool only on the compact column (multi-pool detail stays on Prize Board). E2E test 1 |
| 5 | Founder Q5 section order + saved-order merge | Q5 | **Wired** | `mergeSectionOrder` read-time graft; no data migration |
| 6 | FO page tabs Overview/Approvals/Queue/Finances | Vision §4 / Q1 / Q7 | **Wired** | Queue + Finances mom-only. E2E tests 2-4 |
| 7 | PendingApprovalsSection relocated, mastery fork intact | Vision §3 / #161 | **Wired** | Shared component; E2E test 2 + permissions-wiring test 7 (new home) |
| 8 | Queue surface relocated (real SortTab) | Vision §4 / Q1 | **Wired** | Dead inline QueueTab deleted; modal contract untouched. E2E test 3 + leak-pass test 5 (modal pin) |
| 9 | Finances relocated to FO | Q7 | **Wired** | Legacy links redirect. E2E tests 4 + 9 |
| 10 | Member spot-check w/ founder tab set | Vision §1-2 | **Wired** | E2E test 5 |
| 11 | Inline full edit modal in spot-check | Q4 | **Wired** | Shared `useTaskEditor`/`TaskEditModal` — one save path (atomic RPC) |
| 12 | Spot-check completion credits the kid; no unmark | PRD-14C Screen 2 + D8 | **Wired** | `useTaskCompletion(memberId=target)`; completed rows non-tappable |
| 13 | Sequential [+ Create] relocation | Q8 / #150 | **Wired** | Spot-check Sequential tab (mom); Convention #150 amended |
| 14 | Tasks page purely personal (every role; soft-claim §4.5 kept) | Vision / leak-pass ruling | **Wired** | E2E test 6 + leak-pass test 1 |
| 15 | Member pill bar removed; Guided two-tab untouched | Vision | **Wired** | Guided branch verified by code path (PRD-25 tabs intact) |
| 16 | View carousel + ViewRenderer on Tasks page | Q6 | **Wired** | One renderer two hosts; simple_list keeps segment-aware TaskList (Build M) |
| 17 | Inclusion control: persisted default + session pills + save-as-default | Q2 hybrid | **Wired** | `dashboard_configs.preferences.task_view_inclusion`. E2E test 6 |
| 18 | Sequential next-item-only in views + tap-through to full collection | Q2 | **Wired** | `applyTaskTypeInclusion` + `SequentialDetailModal` (SequentialCollectionCard, #154) |
| 19 | Dad granted-scoped FO (tab gated, members filtered, act-paths gated) | Q3 | **Wired** | E2E tests 7-8; stale `view_as_permissions` read removed; SA never offered FO (PRD-14C) |
| 20 | Spot-check create inherits scoped AssignmentSelector | Coordination Q1 | **Wired** | Born-scoped by REVIEW-ROUTE session (migrations 100262-100264, landed before my Phase 4 shipped) |
| 21 | Deep links: `?view=family_overview&fotab=` + legacy redirects | Q7 | **Wired** | E2E test 9; ViewAs Manage Tasks rewired |
| 22 | FeatureGuide on FO + LiLa knowledge (help-patterns + feature-guide-knowledge) | Convention #14 | **Wired** | 2 new help patterns + page knowledge + use-case recipe |
| 23 | E2E pins: new suite + both regressions green | Dispatch | **Wired** | fo-command-center 9/9 (1 flaky-retry, documented injectSession race); leak-pass 10/10; permissions-wiring 14/14 |
| 24 | Convention #275 added; #150 amended | Convention #14 | **Wired** | CLAUDE.md |
| 25 | Nav parity check | Convention #16 | **N/A** | No sidebar/BottomNav entry added, removed, or renamed (FO lives behind PerspectiveSwitcher; /tasks route unchanged) |
| 26 | "Deploy all" button on Queue surface | Founder request via coordination | **Wired** | Engine landed mid-session; button in SortTab serves modal + FO Queue tab; calendar/context items skipped by design; E2E test 3b |
| 27 | FO Finances tab for finance-granted dads | founder add-on (eyes-on session 2026-06-10) | **Wired** | `useManagementGrants` gating; display scoped to granted kids (per-kid wins incl. 'none' carve-out); levels: view = read-only, contribute = + Pay All, manage = + grace/makeup. E2E test 8b |
| 28 | PRD-14C per-column long-press collapse override + section/column drag-reorder | PRD-14C gap, founder add-on | **Wired** | Long-press (500ms/8px slop) per-column override + dot indicator; ⠿ grips for global section reorder + horizontal column reorder (@dnd-kit, persisted). selectedMembers memo append-fix. E2E test 8c |

| 29 | Compact member pill selector on FO (app-standard pill bar) | founder eyes-on feedback 2026-06-10 | **Wired** | `MemberPillSelector variant="compact"`; grid variant default untouched (PRD-14B Pick Members) |
| 30 | Tap-to-edit on every FO column item (tasks/routines/opps → TaskEditModal; sequential → SequentialDetailModal; trackers → WidgetDetailView; events → EventCreationModal) | founder eyes-on feedback 2026-06-10 | **Wired** | Decision 9 gating (handlers only for actable members); Best Intentions/Victories rows remain display-only (editors live on their own pages — flagged to founder) |
| 31 | Play/Guided day segments in FO columns (grouped tasks + segment-tap → Day Segments editor) | founder ask 2026-06-10 | **Wired** | `isSegmentActiveToday` day-filter aware; mom-only header tap → GamificationSettingsModal; flat list preserved without segments (#208). Play picture-picking already covered by row 30 (TaskIconPicker in the edit modal) |
| 32 | Per-section [+ create] buttons (mom-only) pre-targeted at the column's member | founder ask 2026-06-10 | **Wired** | tasks/routines/opps → TaskCreationModal (`initialAssigneeId` additive prop); sequential → SequentialCreatorModal; events → EventCreationModal (`initialAttendeeIds` additive prop); best_intentions → new CreateBestIntentionModal; victories → new RecordVictoryModal; trackers → WidgetPicker→WidgetConfiguration. Only weekly_completion has no + (config) |
| 33 | Claimed/in-progress opportunities visible on FO + mom [Return]-to-board | founder eyes-on finding 2026-06-10 | **Wired** | Both claim shapes (list-claim bridge tasks + standalone task_claims); unclaim releases claims and frees the board item. `useUnclaimOpportunity` homed in `useOpportunityLists.ts` |
| 34 | Kid voluntary claim release ("Put it back") — PRD-09A gap closed | founder ask 2026-06-10 | **Wired** | Three kid surfaces: board card (claimed-by-you, not pending approval), standalone dashboard card (useReleaseClaim), claim bridge task on own task list (TaskCard, Undo2 icon). No penalty; item returns to the board |

**Summary: 34 Wired · 0 Stubbed · 0 Missing.** (Rows 26-34 landed same-session: the REVIEW-ROUTE engine arrived mid-build, and the founder pulled the two stubs + six eyes-on refinements into scope. E2E fo-command-center 12 tests.)

## Mom-UI Verification

> Verified live by the founder across an extended interactive eyes-on session
> (2026-06-10, desktop, dev server) rather than a formal device-matrix walk.
> Sign-off given 2026-06-12 ("I think we are good to finish off!"). Tablet +
> mobile columns were not individually walked — accepted by founder sign-off;
> Playwright desktop evidence backs every row. Honest gap noted per the
> Visual Verification standard.

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| FO member-column layout + compact pill selector | ✅ founder live | accepted at sign-off | accepted at sign-off | mom | founder feedback round (pills redesigned on her screenshot) + E2E | 2026-06-10 |
| FO new sections (routines/sequential/victories/weekly) | ✅ founder live | accepted at sign-off | accepted at sign-off | mom | screenshot review + E2E test 1 | 2026-06-10 |
| FO relocated Approvals / Queue / Finances tabs | ✅ founder live | accepted at sign-off | accepted at sign-off | mom | founder used Deploy all on Queue; Finances eyes-on | 2026-06-10 |
| Tap-to-edit on column items + spot-check | ✅ founder live | accepted at sign-off | accepted at sign-off | mom | founder request → built → confirmed | 2026-06-10 |
| Claimed opportunities + [Return] | ✅ founder live | accepted at sign-off | accepted at sign-off | mom | founder: "That did work for the return!" (post-100265) | 2026-06-10 |
| Per-section [+ create] buttons (incl. Victory modal) | ✅ founder live | accepted at sign-off | accepted at sign-off | mom | founder request → built same session | 2026-06-10 |
| Tasks page personal view + carousel + inclusion pills | ✅ Playwright + founder | accepted at sign-off | accepted at sign-off | mom, adult, teen | E2E test 6 + leak-pass | 2026-06-10 |
| Dad's granted-scoped FO (adult shell) | ✅ Playwright | accepted at sign-off | accepted at sign-off | adult | E2E tests 7/8/8b | 2026-06-10 |
| Kid "Put it back" release (3 surfaces) | DB-verified + authenticated probe | accepted at sign-off | accepted at sign-off | (kid surfaces) | probe 204 + same mutation as founder-verified [Return] | 2026-06-10 |

## Test plan

- New Playwright suite extending `tests/e2e/permissions/role-scoping-leak-pass.spec.ts` pattern (Testworth family, service-role fixtures, unique prefix, afterAll cleanup).
- Regression: `role-scoping-leak-pass.spec.ts` AND `permissions-wiring.spec.ts` must stay green (same Tasks surface).
- `./node_modules/.bin/tsc -b` clean (Convention #121); lint no new errors.

## Close-out checklist (Convention #14)

- Post-Build Verification table (zero Missing) + Mom-UI table complete
- WIRING_STATUS.md, BUILD_STATUS.md, feature-decisions README index, follow-up queue memory (item 11 → shipped)
- CLAUDE.md convention amendments (#150 entry point; supersession notes; any new conventions)
- `<FeatureGuide featureKey="family_overview" />` if page identity changes materially; LiLa knowledge (help-patterns.ts + feature-guide-knowledge.ts)
- Logical commits per phase; stage ONLY this build's files (parallel sessions share the tree); push at end
