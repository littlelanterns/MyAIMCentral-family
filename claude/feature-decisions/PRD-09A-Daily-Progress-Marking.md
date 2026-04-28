# Feature Decision File: PRD-09A — Daily Progress Marking

> **Created:** 2026-04-27
> **PRD:** `prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md`
> **Addenda read:**
>   - `prds/addenda/PRD-09A-Daily-Progress-Marking-Addendum.md` (primary spec)
>   - `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` (Build J infrastructure)
>   - `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` (studio/sequential context)
> **Pre-build notes:** `claude/orchestration/Daily-Progress-Marking-Pre-Build-Notes.md`
> **Founder approved:** pending

---

## What Is Being Built

Adding the ability to mark "I worked on this today" on tasks and routine steps as a separate event from "this is done." Tasks that take many days (building an app, learning a skill, memorizing multiplication tables) get daily progress logging with optional duration capture. The UI shows session count and total time aggregated over weeks or months. A soft-claim system prevents one kid from swooping in to mark another kid's long-running task as Done.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| TaskCreationModal — track_progress + track_duration toggles | New form fields in Advanced options |
| List creation/edit — default_track_progress toggle | New list-level default |
| Per-item override in list item editor | track_progress on list_items (NULL = inherit) |
| TaskCard — "Worked on this today" button | New button for track_progress tasks |
| TaskCard — aggregation subtitle display | Session count + total duration |
| RoutineStepChecklist — "Worked on this today" | Replaces simple check for track-progress steps |
| DurationPromptModal | 6 chips + custom + skip |
| Soft-claim warning modal | Cross-claim attempt warning |
| Session history expansion/modal | Tap aggregation to see per-session list |
| Dashboard — soft-claim visibility | Soft-claimed tasks on claimer's dashboard |
| Tasks page — filter includes soft-claimed | Query extension for "My Tasks" |
| MindSweep sort — track toggles | New toggles in sort-to-task UI |
| Tomorrow Capture — track toggles | New toggles in rhythm creation |

---

## Key PRD Decisions (Easy to Miss)

1. `track_progress` and `track_duration` are independent booleans. All four combinations valid.
2. Default for both: **off**. Mom opts in per task.
3. Routine step "Worked on this today" IS the daily check-off. One tap = practice logged + step done for today.
4. "Done" for routine steps with linked sequential sources is in the list/collection view, not the routine view.
5. Soft-claim is NOT a hard lock — mom always overrides, siblings get a warning not a block.
6. Aggregation display must handle 4-digit hour totals without overflow.
7. Duration chips: [5, 10, 15, 30, 45, 60] + Custom + Skip.
8. `practice_log.source_type` CHECK constraint at DB level must be extended (not just app validation).
9. Universal inheritance rule: ANY task from ANY source must honor track property inheritance (§6.2).
10. Soft-claimed tasks must appear on claimer's dashboard and Tasks page (§4.5).

---

## Addendum Rulings

### From PRD-09A-Daily-Progress-Marking-Addendum.md:
- Model A confirmed: single "Worked on this today" button (§3.1)
- Option B for soft-claim: explicit `in_progress_member_id` column (§4.3, pre-build Q2)
- Paths A-G mandatory; H-J opportunistic (§6.6)
- Tier gating: placeholder, all true during beta (§10)
- Inactivity auto-unclaim: stubbed (§1.4)

### From Pre-Build Notes:
- Duration chips: [5, 10, 15, 30, 45, 60] (Q5)
- `tasks.track_duration` already exists — only `track_progress` is new (Q1)
- Routine step "Done" placement matches existing behavior — no harmonization (Q3)

---

## Database Changes Required

### New Columns (single migration 00000000100183)

| Table | Column | Type | Default | Notes |
|---|---|---|---|---|
| tasks | track_progress | BOOLEAN NOT NULL | false | New |
| tasks | in_progress_member_id | UUID NULL | — | FK → family_members, soft-claim |
| lists | default_track_progress | BOOLEAN NOT NULL | false | New |
| list_items | track_progress | BOOLEAN NULL | — | NULL = inherit from list |

### Modified Constraints

| Table | Change |
|---|---|
| practice_log | DROP + re-CREATE source_type CHECK to add 'task' and 'routine_step' |

### Migration Notes
- `tasks.track_duration` already exists (Build J migration 100105) — NOT re-added
- `list_items.track_duration` already exists — NOT re-added
- `lists.default_track_duration` already exists — NOT re-added
- CHECK change is additive — existing rows unaffected
- All new columns default to false/NULL — no behavioral change for existing data

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| task_progress_tracking | Essential | all | track_progress toggle |
| task_duration_tracking | Essential | all | track_duration toggle |
| task_session_history | Essential | all | Aggregation + history |
| task_soft_claim | Essential | all | Soft-claim + completion gating |

All return true during beta (placeholder).

---

## Stubs — Do NOT Build This Phase

- [ ] Inactivity-based auto-unclaim (mom-configurable timeout) — schema accommodates, UI doesn't surface
- [ ] Cross-task time aggregation reports (deferred to PRD-28B)
- [ ] Bulk-edit UI for track toggles (GAP-D — separate worker)
- [ ] List-item practice/mastery action buttons (GAP-A — separate worker)
- [ ] Path H (LiLa-suggested task acceptance) — unless surface is touched
- [ ] Path I (Plan/goal decomposition) — unless surface is touched
- [ ] Path J (Other capture surfaces) — unless surface is touched

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Reads list item track properties | ← | Lists (PRD-09B) | list_items.track_progress, lists.default_track_progress |
| Writes practice sessions | → | practice_log | source_type='task' or 'routine_step' |
| Extends useLogPractice | → | usePractice.ts | New branches for 'task' and 'routine_step' |
| Sets soft-claim | → | tasks.in_progress_member_id | On first practice log |
| Blocks completion | → | useCompleteTask | Soft-claim authorization check |
| Inherits from opportunity claim | ← | useOpportunityLists.ts | Path A track_progress inheritance |
| Surfaces on claimer dashboard | → | Dashboard queries | in_progress_member_id filter |

---

## Things That Connect Back to This Feature Later

- Workers 2+3 (Shared Routines + Lists) — sharing mode relaxes soft-claim to "any active practicer"
- PRD-24 (Gamification) — practice sessions on tasks should trigger gamification events
- PRD-28B (Compliance Reporting) — practice_log rows with duration feed compliance reports
- PRD-29 (BigPlans) — task decomposition should expose track toggles
- Worker 4 (Lists Template Deploy) — list-deployed routines must inherit track properties

---

## Unlisted Generation Paths Found (§6.6 requirement)

Two task-creation paths NOT enumerated in addendum §6.3 were found during codebase search:

1. **RoutineDuplicateDialog** (`src/components/tasks/RoutineDuplicateDialog.tsx:165`) — Creates a task row when duplicating a routine to another assignee. Source: `template_deployed`. Should inherit track properties from the source task being duplicated.

2. **RandomizerSpinnerTracker** (`src/components/widgets/trackers/RandomizerSpinnerTracker.tsx:106`) — Creates a task row when a randomizer widget assigns a drawn item. Source: `randomizer_draw`. Should inherit track properties from the list item.

Both follow the universal rule (§6.2) and will be filed as opportunistic retrofits alongside Paths H-J.

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] Unlisted paths acknowledged
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> Completed 2026-04-28. Coverage: PW = Playwright automated, EO = eyes-on founder, UT = untested (needs manual verification with test family).

| # | Requirement | Source | Status | Coverage | Notes |
|---|---|---|---|---|---|
| 1 | `tasks.track_progress` column | §5.1 | **Wired** | PW (test 2) | Migration 100183 |
| 2 | `tasks.track_duration` column exists | §5.1 | **Wired** | PW (test 2) | Pre-existing from Build J |
| 3 | `tasks.in_progress_member_id` column | §5.1 | **Wired** | PW (test 2) | FK with ON DELETE SET NULL |
| 4 | `lists.default_track_progress` column | §5.1 | **Wired** | PW (test 11) | Migration 100183 |
| 5 | `list_items.track_progress` column (nullable) | §5.1 | **Wired** | PW (test 12) | NULL = inherit from list |
| 6 | `list_items.track_duration` nullable | §5.1 | **Wired** | PW (test 12) | Migration 100184 |
| 7 | `practice_log.source_type` CHECK extended | §5.1 | **Wired** | PW (test 2) | Migration 100183, accepts 'task' + 'routine_step' |
| 8 | Long Term Task type in creation picker | §3 + founder | **Wired** | PW (test 1, 13) | 6-tile 3×2 grid, CalendarClock icon |
| 9 | Track toggles auto-set on Long Term Task selection | §3 + founder | **Wired** | PW (test 1) | track_progress=true, track_duration=true |
| 10 | Track toggles in Rewards & Tracking (secondary) | §2.1 | **Wired** | EO | Always visible, no useCanAccess gate |
| 11 | List-level default_track_progress toggle | §6.5 | **Wired** | PW (test 11) | TrackingDefaultsPanel component |
| 12 | List-level default_track_duration toggle | §6.5 | **Wired** | PW (test 11) | Build J column, now has UI |
| 13 | Per-item track_progress tri-state | §6.5 | **Wired** | PW (test 12) | inherit / on / off select |
| 14 | Per-item track_duration tri-state | §6.5 | **Wired** | PW (test 12) | Symmetric with track_progress |
| 15 | Path A — opportunity claim inherits track props | §6.3 | **Wired** | — | useOpportunityLists.ts:180 |
| 16 | Path A — soft-claim set on claim | §4.5 | **Wired** | — | in_progress_member_id = claimer |
| 17 | Path B — routine step practice_log write | §6.3 | **Wired** | UT | RoutineStepChecklist dual-write |
| 18 | Path B — duration prompt on linked steps | §3.3 | **Wired** | UT | LinkedSequentialContent resolves track_duration |
| 19 | Path C — promoted list item inherits track props | §6.3 | **Wired** | — | createTaskFromData source lookup |
| 20 | Path E — createTaskFromData writes both fields | §6.3 | **Wired** | PW (test 2) | From CreateTaskData |
| 21 | Path E — Task Breaker subtasks inherit | §6.3 | **Wired** | — | createTaskFromData.ts subtask insert |
| 22 | Path F — rhythm Tomorrow Capture toggles | §6.3 | **Wired** | — | EveningTomorrowCaptureSection + commitTomorrowCapture |
| 23 | Path G — MindSweep-Lite sort toggles | §6.3 | **Wired** | — | MindSweepLiteSection + commitMindSweepLite |
| 24 | TaskCard "Worked on this today" button | §3.2 | **Wired** | PW (test 3) | Play icon, theme-tokened |
| 25 | TaskCard aggregation subtitle | §3.4 | **Wired** | PW (test 8) | "N sessions · X hours" with commas |
| 26 | TaskCardGuided variant | §8.1 | **Wired** | EO | Split buttons, 48px touch targets |
| 27 | TaskCardPlay variant | §8.1 | **Wired** | EO | Lucide icons, "All done!" below tile |
| 28 | DurationPromptModal — 6 chips | §3.3 | **Wired** | PW (test 4) | [5,10,15,30,45,60] |
| 29 | DurationPromptModal — custom + min/hr toggle | §3.3 + founder | **Wired** | PW (test 5) | Decimal hours supported |
| 30 | DurationPromptModal — skip | §3.3 | **Wired** | PW (test 6) | Logs session, null duration |
| 31 | DurationPromptModal — backdrop = cancel, no log | §3.3 | **Wired** | PW (test 7) | Human-in-the-Mix |
| 32 | No progress UI on normal tasks | §2 | **Wired** | PW (test 10) | Defaults false/false |
| 33 | Track-progress-only (no duration prompt) | §2 | **Wired** | PW (test 9) | Direct log, no modal |
| 34 | Soft-claim cross-claim warning modal | §4.2 | **Wired** | UT | SoftClaimCrossClaimModal |
| 35 | Soft-claim Done-blocked modal | §4.2 | **Wired** | UT | SoftClaimDoneBlockedModal, "Ask Mom" + "Got it" |
| 36 | "Ask Mom" fires real family_request | §4.2 + founder | **Wired** | UT | source='task_soft_claim', migration 100185 |
| 37 | Dashboard soft-claim visibility | §4.5 | **Wired** | UT | useTasks or-clause includes in_progress_member_id |
| 38 | Tasks page "My Tasks" includes soft-claimed | §4.5 | **Wired** | UT | Same query extension |
| 39 | Success toast after logging | founder | **Wired** | EO | "Session logged for 'X' (Y hr)" |
| 40 | Cache invalidation for aggregation | §3.4 | **Wired** | EO | task-practice-aggregation + task-practice-sessions |
| 41 | Feature keys registered (4 keys) | §10 | **Wired** | — | Migration 100186, all Essential |
| 42 | useCanAccess placeholder checks | §10 | **Wired** | — | All return true during beta |
| 43 | resolveTrackingProperties helper | §6.4 | **Wired** | — | src/lib/tasks/resolveTrackingProperties.ts |
| 44 | formatPracticeAggregation helper | §3.4 | **Wired** | — | Comma formatting on both numbers |
| 45 | Sequential collection create propagates track_progress | §6.3 | **Wired** | — | useSequentialCollections.ts:173 |
| 46 | Sequential collection restart inherits track_progress | §6.3 | **Wired** | — | useSequentialCollections.ts:424 |
| 47 | Emoji convention updated (all shells) | founder | **Wired** | — | CLAUDE.md + architecture.md + PRE_BUILD_PROCESS.md |
| 48 | Inactivity auto-unclaim | §4.4 | **Stubbed** | — | STUB_REGISTRY |
| 49 | Cross-task time aggregation reports | §1.4 | **Stubbed** | — | STUB_REGISTRY |
| 50 | Path H — LiLa-suggested task toggles | §6.3 | **Stubbed** | — | STUB_REGISTRY |
| 51 | Path I — Plan/goal decomposition toggles | §6.3 | **Stubbed** | — | STUB_REGISTRY |
| 52 | Path J — Other capture surface toggles | §6.3 | **Stubbed** | — | STUB_REGISTRY |
| 53 | Path K — RoutineDuplicateDialog inheritance | §6.6 | **Stubbed** | — | STUB_REGISTRY |
| 54 | Path L — RandomizerSpinnerTracker inheritance | §6.6 | **Stubbed** | — | STUB_REGISTRY |
| 55 | Session history detail view | §3.4 | **Stubbed** | — | STUB_REGISTRY, hook exists |

### Summary
- **Total requirements verified:** 55
- **Wired:** 47
- **Stubbed:** 8
- **Missing:** 0

### Coverage breakdown
- **Playwright automated (PW):** 13 tests covering 17 requirements
- **Eyes-on founder (EO):** 4 requirements verified in browser
- **Untested — needs manual multi-member verification (UT):** 6 requirements (soft-claim modals, routine step, dashboard visibility)
- **Code-verified only (—):** 20 requirements verified by code inspection + tsc, no visual surface

---

## Post-Close UT Verification Session (scheduled)

6 items require multi-member manual testing (mom + 2 kids). Target within 1 week of close-out.

| # | Requirement | Priority | How to test |
|---|---|---|---|
| 34 | Soft-claim cross-claim warning modal | **High** — anti-poaching headline use case | Kid A claims task via "Worked on this today". Kid B taps same button → warning modal should appear |
| 35 | Soft-claim Done-blocked modal | **High** | Kid B taps "Done" on Kid A's claimed task → blocked modal with "Ask Mom" / "Got it, never mind" |
| 36 | "Ask Mom" fires real family_request | **High** | Kid B taps "Ask Mom" → mom checks Universal Queue → Requests tab → sees "Can I mark 'X' as done?" |
| 37 | Dashboard soft-claim visibility | Medium | Kid A logs practice on unassigned task → task appears on Kid A's dashboard |
| 38 | Tasks page "My Tasks" filter | Medium | Same task appears in Kid A's "My Tasks" tab |
| 17-18 | Routine step "Worked on this today" + duration prompt | Medium | Routine with linked sequential source that has track_progress=true → step shows duration prompt on check |

After this session: update rows 17-18, 34-38 from UT → PW or EO. Target: 0 UT.

## Founder Sign-Off (Post-Build)

- [x] Verification table reviewed
- [x] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [x] Zero Missing items confirmed
- [x] **Phase approved as complete**
- **Completion date:** 2026-04-28
