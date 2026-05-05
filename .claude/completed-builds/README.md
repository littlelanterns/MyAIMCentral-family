# Completed Builds — Archive + Ledger

> This folder holds signed-off build files organized by year-month. It is **tracked in git** and **not auto-loaded** into Claude Code sessions. Search it on-demand via mgrep when you need to recall the pre-build summary, decisions, or stubs from a historical build. The canonical post-verification record for each build lives in `claude/feature-decisions/`; this folder preserves the pre-build context that produced those verification tables.

## How this folder works

- New month = new subfolder: `.claude/completed-builds/YYYY-MM/`
- One `.md` file per signed-off build, filename pattern `build-<letter>-<prd>-<kebab-title>.md` (or `phase-<id>-<prd>-<kebab-title>.md` for phase-numbered builds)
- On sign-off, the active build's file is moved from `.claude/rules/current-builds/` into the appropriate month subfolder and this README index is updated
- The ledger section below is the rolling chronological completion log going back to 2026-03-25

## Index

### 2026-05

| Build | PRD | Signed off | File |
|---|---|---|---|
| Phase 3.7 — Wizards & Seeded Templates | Connector Architecture — 3 wizards, 3 seeded templates, NLC entry point, Drafts tab, migration 100229 | 2026-05-04 | [phase-3.7-wizards-seeded-templates.md](2026-05/phase-3.7-wizards-seeded-templates.md) |
| Phase 3 — Connector Layer | Connector Architecture — 12 godmothers, deed_firings, contracts, IF evaluation, presentation layer, `/contracts` + `/prize-board` | 2026-05-03 | [phase-3-connector-layer.md](2026-05/phase-3-connector-layer.md) |
| Workers 2+3 — Shared Routines + Shared Lists | PRD-09A/09B — Multi-instance FIRST-N-COMPLETERS, cross-sibling edit authority, list claim semantics, shared list modes | 2026-05-02 | [workers-2-3-shared-routines-lists.md](2026-05/workers-2-3-shared-routines-lists.md) |
| Universal Capability Parity — Stages 1+2+3 | PRD-09A/09B cross-cutting — content edit timing, pending_changes, cron, Family Overview fix | 2026-05-01 | [universal-capability-parity-stages-1-2-3.md](2026-05/universal-capability-parity-stages-1-2-3.md) |

### 2026-04

| Build | PRD | Signed off | File |
|---|---|---|---|
| Daily Progress Marking | PRD-09A Addendum — Long Term Task type, soft-claim, duration tracking | 2026-04-28 | [daily-progress-marking.md](2026-04/daily-progress-marking.md) |
| Worker 5 | PRD-35 + Connector Architecture — Painter / Universal Scheduler Upgrade | 2026-04-27 | [worker-5-painter-universal-scheduler-upgrade.md](2026-04/worker-5-painter-universal-scheduler-upgrade.md) |
| Build P | PRD-16 Meetings | 2026-04-16 | [build-p-prd-16-meetings.md](2026-04/build-p-prd-16-meetings.md) |
| Build M | PRD-24 + PRD-26 Play Dashboard + Sticker Book + Configurable Earning Strategies | 2026-04-16 (formalized; recorded 2026-04-13) | [build-m-prd-24-26-play-dashboard.md](2026-04/build-m-prd-24-26-play-dashboard.md) |
| Build O | PRD-28 Tracking, Allowance & Financial | 2026-04-13 | [build-o-prd-28-tracking.md](2026-04/build-o-prd-28-tracking.md) |
| Phase 1b | PRD-23 BookShelf Platform Migration | 2026-04-13 | [phase-1b-prd-23-bookshelf-platform-migration.md](2026-04/phase-1b-prd-23-bookshelf-platform-migration.md) |
| Build N | PRD-18 Phase D Independent Teen Tailored Rhythm | 2026-04-07 | [build-n-prd-18-phase-d-teen-rhythm.md](2026-04/build-n-prd-18-phase-d-teen-rhythm.md) |
| Build I | PRD-18 Phase A Rhythms & Reflections Foundation | 2026-04-07 | [build-i-prd-18-phase-a-rhythms.md](2026-04/build-i-prd-18-phase-a-rhythms.md) |
| Build L | PRD-18 Phase C AI-Powered Enhancements | 2026-04 (superseded by Build N) | [build-l-prd-18-phase-c-ai-enhancements.md](2026-04/build-l-prd-18-phase-c-ai-enhancements.md) |
| Build K | PRD-18 Phase B Periodic Rhythms + Tomorrow Capture + On the Horizon + Carry Forward | 2026-04 (superseded by Build L/M/N) | [build-k-prd-18-phase-b.md](2026-04/build-k-prd-18-phase-b.md) |
| Build J | PRD-09A/09B Linked Routine Steps, Mastery & Practice Advancement (Session 2) | 2026-04-06 | [build-j-prd-09a-09b-linked-steps.md](2026-04/build-j-prd-09a-09b-linked-steps.md) |
| Build H | PRD-09A/09B Studio Intelligence Phase 1 | 2026-04-06 | [build-h-prd-09a-09b-studio-intelligence-p1.md](2026-04/build-h-prd-09a-09b-studio-intelligence-p1.md) |
| Build G | PRD-15 Messages, Requests & Notifications | 2026-04 (plan-stage archive) | [build-g-prd-15-messages.md](2026-04/build-g-prd-15-messages.md) |
| Build F | PRD-23 BookShelf Platform Library Phase 1 | 2026-04 | [build-f-prd-23-bookshelf-phase-1.md](2026-04/build-f-prd-23-bookshelf-phase-1.md) |
| Build E | PRD-17B MindSweep | 2026-04-03 | [build-e-prd-17b-mindsweep.md](2026-04/build-e-prd-17b-mindsweep.md) |
| Build D | PRD-17 Universal Queue & Routing (Gap-Fill) | 2026-04-03 | [build-d-prd-17-queue-gap-fill.md](2026-04/build-d-prd-17-queue-gap-fill.md) |
| Build C | PRD-25 Guided Dashboard (Phase A) | 2026-04 | [build-c-prd-25-guided-dashboard-phase-a.md](2026-04/build-c-prd-25-guided-dashboard-phase-a.md) |

**Notes on the index**

- Build O and Phase 1b files each carry an editorial archive note preserving the drift that was present in the original `CURRENT_BUILD.md` (their section headers were not updated when the builds were signed off). This is intentional — Phase 0.26 is documenting the drift, not erasing it.
- Build G's "plan-stage archive" label: the section was a pre-build summary that carried through into implementation without a discrete sign-off event; the pre-build summary is preserved here for reference.
- Some sign-off dates in the index are approximate where the original `CURRENT_BUILD.md` did not record one — see each file's internal status line for the most precise date available.

---

## Completion history 2026-03-25 through 2026-04-07

> Ledger preserved as-found from the original `CURRENT_BUILD.md` tail (lines 2600–2637). Entries for Builds J through P and Phase 1b are not present — the ledger stopped being updated after Build I. The index table above provides the complete lookup for those builds.

*PRD-06 (Guiding Stars & Best Intentions) + PRD-07 (InnerWorkings repair) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-06-Guiding-Stars-Best-Intentions.md` and `claude/feature-decisions/PRD-07-InnerWorkings-repair.md`.*

*PRD-10 Phase A (Widgets, Trackers & Dashboard Layout) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-10-Widgets-Trackers-Dashboard-Layout.md`.*

*PRD-13 (Archives & Context) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-13-Archives-Context.md`. 94 requirements: 80 wired, 14 stubbed, 0 missing.*

*Bug fixes (View As modal, Hub navigation, Notepad close) completed 2026-03-25. No new stubs.*

*PRD-21A (AI Vault Browse & Content Delivery) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-21A-AI-Vault-Browse.md`. 88 requirements: 74 wired, 14 stubbed, 0 missing. 12 new tables, 3 content items loaded, sidebar simplified to Lucide icons.*

*PRD-21 (Communication & Relationship Tools) completed 2026-03-26. Verification archived to `claude/feature-decisions/PRD-21-Communication-Relationship-Tools.md`. 42 requirements: 32 wired, 10 stubbed, 0 missing. 8 Edge Functions deployed, 4 new tables, AI Toolbox sidebar + QuickTasks buttons, 198 condensed intelligence items powering system prompts.*

*PRD-34 (ThoughtSift — Decision & Thinking Tools) completed 2026-03-26. 3 sub-phases: 34A (Foundation + Translator + Decision Guide), 34B (Perspective Shifter + Mediator), 34C (Board of Directors). 6 tables, 5 Edge Functions, 18 personas + 17 lenses + 15 frameworks seeded, 5 vault items. Total: 129 wired, 22 stubbed, 0 missing across all sub-phases.*

*UX Overhaul Sessions 1-5 completed 2026-03-28. Density system, ModalV2, hardcoded color audit, QuickCreate FAB, calendar visual overhaul, DateDetailModal, calendar settings, tooltip conversion, list task type, tracker quick-create, element size preference.*

*PRD-14 (Personal Dashboard Reconciliation) completed 2026-03-30. Verification archived to `claude/feature-decisions/PRD-14-Personal-Dashboard.md`. 42 requirements: 37 wired, 5 stubbed, 0 missing. Data-driven section system, Guiding Stars greeting rotation, starter widget auto-deploy, perspective switcher expansion (all roles), View As full shell modal with theme persistence, acted_by attribution on 3 tables, permission-gated member picker, feature exclusion enforcement. BookShelf + ThemeSelector added to Independent/Adult shells.*

*PRD-14C (Family Overview) completed 2026-03-31. Verification archived to `claude/feature-decisions/PRD-14C-Family-Overview.md`. 20 wired, 8 stubbed (4 planned + 4 UX polish deferred), 0 missing. Per-member config, member pill selector, pending items bar, horizontally-scrollable member columns with 7 section types, dad's scoped view.*

*PRD-23 (BookShelf Sessions A+B) completed 2026-03-31. Verification archived to `claude/feature-decisions/PRD-23-BookShelf.md`. 44 wired, 0 stubbed, 0 missing. Session A: Library page, tag filter bar, 7 sort options, grid/compact layout, collection CRUD, multi-select, continue banner. Session B: 5-layer extraction browser, ExtractionBrowser with single/multi/collection/hearted modes, 5 specialized item components, ApplyThisSheet (8 destinations), SemanticSearchPanel, ChapterJumpOverlay, 2 Edge Functions (bookshelf-search, bookshelf-key-points), JournalPromptsPage, migration 100066 (vector search RPCs). 42 new files total.*

*PRD-23 (BookShelf Polish) completed 2026-04-01. Wired Search Library button, added History button to library, added action buttons to collection/multi-book view, removed Refresh Key Points (redundant). Fixed bookshelf-discuss: added missing discussion_type column, fixed model ID, fixed extraction query column name (user_id → family_member_id), added source honesty guardrail. Built `_shared/context-assembler.ts` — three-layer relevance-filtered context assembly module (first consumer: bookshelf-discuss). Added Layered-Context-Assembly-Spec.md for future Edge Function migrations. 5 Playwright tests with real API calls passing.*

*PRD-11 (Victory Recorder Phases 12A+12B+12C) completed 2026-04-02. Verification archived to `claude/feature-decisions/PRD-11-Victory-Recorder.md`. Phase 12A: core recording, browsing, celebration for adults/teens — VictoryRecorder page, RecordVictory modal, CelebrationModal, CelebrationArchive, celebrate-victory Edge Function, useVictories hook, activity log trigger. Phase 12B: intelligence layer — scan-activity-victories Edge Function, Victory Suggestions UI, CompletionNotePrompt, 4 activity log sources, Notepad victory routing, LiLa action chip, useVictoryReckoningContext hook. Phase 12C: DailyCelebration 5-step overlay for Guided/Play, SimplifiedRecordVictory for kids, ConfettiBurst + AnimatedList components, 15 voice personalities, VoiceSelector, useVoicePreference hook, celebrate-victory voice param + roleToMemberType bug fix, CelebrateSection + PlayShell Celebrate button wired. PRD-11B (Family Celebration) NOT built — separate future phase.*

*PRD-14D (Family Hub Phase A) completed 2026-04-03. 4 tables (family_hub_configs, family_best_intentions, family_intention_iterations, countdowns) + calendar_events.show_on_hub column. Hub Mode kiosk lock with PIN (hash_hub_pin + verify_hub_pin RPCs). Member Quick Access: PIN auth modal triggers ViewAs with privacy exclusions (Safe Harbor auto-excluded per PRD-20, private journals filtered). Hub Settings: full CRUD for intentions, countdowns, section order, Hub PIN. 2 personal dashboard widgets (info_family_intention, info_countdown) registered in widget catalog. ViewAs routing: 17 missing page routes added. Pre-existing TS errors fixed (QuickTasks, CalendarTab, Tasks). Remaining stubs: Slideshow (Phase B), TV Mode (PRD-14E), Family Vision section (PRD-12B), Special Adult shift-scoped access (PRD-27).*

*PRD-17 (Universal Queue & Routing — Gap-Fill) completed 2026-04-03. Verification archived to `claude/feature-decisions/PRD-17-Universal-Queue-Routing.md`. 30 wired, 7 stubbed, 0 missing. Gap-fill: QuickTasks opens modal, CalendarTab with Approve/Edit/Reject, ListPickerModal for list items, QueueBadge on Dashboard+Tasks+Calendar, calendar status bug fixed, Quick Mode schedule passthrough, shared task visibility, RoutingToastProvider on Adult/Independent shells. 24 Playwright E2E tests (Dad flows, teen access, honey-do pipeline).*

*PRD-17B MindSweep Sprint 1+2 completed 2026-04-03. Phase A (data layer, migration 100089, mindsweep-sort Edge Function, 5 tables, classify_by_embedding RPC, useMindSweep hooks, QueueCard confidence badges, RoutingStrip tile) + Phase B partial (MindSweepCapture page at /sweep with text/voice/scan/link/holding queue/settings, mindsweep-scan Edge Function for vision OCR + link summarization, useVoiceInput <30s Web Speech optimization, useRunSweep shared hook, UndoToast optional onUndo). /simplify review applied: stale closure fix, triplicated reset extraction, shared sweep runner, cache invalidation mutations, auto-reset timer, concurrent inserts, type cleanup. 11 Playwright E2E tests passing. Phase B remaining: auto-sweep pg_cron, share-to-app, PWA manifest, IndexedDB offline. Phase C not started.*

*PRD-09A/09B Studio Intelligence Phase 1 (Build H) completed 2026-04-06. Verification archived to `claude/feature-decisions/PRD-09A-09B-Studio-Intelligence-Phase-1.md`. 27 wired, 0 stubbed, 0 missing. Fixed a critical silent bug: sequential collection creation was broken everywhere (dead code in SequentialCreator/SequentialCollectionView with zero callers; sequential_collections table had 0 rows in production). Revived dead code via new SequentialCreatorModal wrapper, wired it from Studio + Tasks → Sequential tab + Lists page [+ New List] picker, added two-layer guards (createTaskFromData throws, TaskCreationModal skips initialTaskType='sequential'), removed the broken inline SequentialTab sub-component. Cross-surface visibility: sequential collections now appear on the Lists page alongside regular lists (with Sequential badge + progress) AND on the Tasks → Sequential tab (dual access). One-line randomizer fix: added 'randomizer' to Lists.tsx type picker grid. Data foundation: capability_tags required field on StudioTemplate type, populated on all 27 seed templates + widget starter config adapter. Zero database migrations. Deliberate PRD divergence from PRD-09A line 469 documented. 4 Playwright E2E tests passing (sequential creation DB verification, Lists page visibility, Tasks tab visibility, randomizer creation). Session 2 (Linked Steps addendum — advancement modes, practice_log, curriculum-parse Edge Function, Reading List template) and Session 3 (Studio Phase 2 — intent-based search, use case categories, My Library) are the follow-ons.*

*PRD-18 Phase A — Rhythms & Reflections Foundation (Build I) completed 2026-04-07. Verification archived to `claude/feature-decisions/PRD-18-Rhythms-Reflections.md`. 51 wired, 14 stubbed, 0 missing across 65 requirements. Migration 100103 created `rhythm_configs`, `rhythm_completions`, `feature_discovery_dismissals`, `morning_insight_questions` tables + 12 feature keys + 32 feature_access_v2 rows + extended `auto_provision_member_resources` trigger. 26 family members backfilled (98 rhythm_configs total). Adult morning + evening rhythm modals built with auto-open once-per-period, snooze, dismiss, Close My Day. Date-seeded PRNG for deterministic daily rotation. 13-section evening fixed sequence with mood triage REMOVED per Enhancement 6 founder decision. Reuses existing reflection_prompts/reflection_responses infrastructure (already built in 100071/100072) — no rebuild. Rhythm cards render at position 0 OUTSIDE the data-driven section system, truly auto-managed. Sidebar simplified: old "Morning Rhythm"/"Evening Review" entries replaced with single "Rhythms" entry pointing to new /rhythms/settings page. Mid-build addition: mini evening rhythm for Guided members (migrations 100104 + 100106) — 5-section narrative arc Highlights → Pride → Reflections → Tomorrow → Close. Pride and Tomorrow sections each have 6 rotating wordings via date-seeded PRNG. NEW GuidedReflectionsSection pulls from existing reflection_prompts library, filters to 20 hardcoded child-friendly sort_orders, picks one via PRNG with inline View All expander to swap to any of the 20 (mirrors planned teen pattern from Enhancement 30). Reading Support flag flows through Modal → Card → SectionRendererSwitch → sections. 3 existing active Guided members backfilled. Coexists with existing CelebrateSection/DailyCelebration (PRD-11). Play kids stay unchanged. Bug fix: useReflections.ts UTC timezone bug (`new Date().toISOString().split('T')[0]`) caused reflections to be tagged with tomorrow's date in late evening (beta_glitch_reports 8dc4b2bd). Replaced 4 call sites with `todayLocalIso()` helper. Backfilled 13 historical misdated rows across 3 members using `families.timezone`. 17/17 RLS tests pass. `tsc -b` clean. Phases B/C/D deferred (Enhancement Addendum items 1-8). Systemic UTC bug pattern flagged in 21 other files for separate cleanup pass via shared `@/utils/dates` module.*

---

## Forward note: README scale management

At current scale (15 entries + ~30-line ledger) this README is readable in one scroll. Projection: if builds continue at roughly current cadence, the index could reach 100+ entries in 12 months and this README will become unwieldy.

**Escape hatch when that happens:** split the rolling index into per-month README files inside each `YYYY-MM/` subfolder. This root README then collapses to a summary + links to the per-month READMEs, and the global ledger either gets archived to a separate `LEDGER.md` sibling file or gets split month-by-month alongside. Splitting is cheap — just don't pre-split now before it's needed.

Flagging here so a future you (or a future Claude session) doesn't have to re-derive the reasoning when the README starts feeling too long.
