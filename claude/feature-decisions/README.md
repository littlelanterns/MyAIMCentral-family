# Feature Decisions

> Consolidated build references — one file per PRD, written before each build, kept permanently.

---

## Purpose

Each file in this folder is a synthesis of one PRD + all its addenda.
It is written by Claude during the pre-build process, reviewed by Tenise, and used as
the working reference during the build.

These files exist to solve a specific problem: important decisions buried in PRDs and
addenda were getting missed at build time, producing wrong code that had to be torn out.
This folder is the fix.

---

## What Each File Contains

- Every screen and component to be built (explicit list)
- Key PRD decisions most likely to be missed
- Every addendum ruling that affects this build
- Database changes required
- Feature keys to register
- Explicit stub list (what NOT to build this phase)
- Cross-feature connections
- Founder approval record

---

## How Files Get Created

As part of the Pre-Build Process (`claude/PRE_BUILD_PROCESS.md`):

1. Claude reads the full PRD + all addenda
2. Claude creates this file from `_TEMPLATE.md`
3. Tenise reviews and approves
4. Only then does code get written

---

## File Naming

`PRD-XX-FeatureName.md` — matches the PRD number and feature name exactly.

---

## These Files Are Permanent

Once written, these files stay in the codebase. They are the record of what was
decided and why at build time. Do not delete them after a feature ships.

---

## Files in This Folder

| File | PRD | Build Date | Status |
|---|---|---|---|
| PRD-02-repair.md | PRD-02 | 2026-03-25 | Complete (18 wired, 3 stubbed) |
| PRD-03-repair.md | PRD-03 | 2026-03-25 | Complete (19 wired, 0 stubbed) |
| PRD-04-repair.md | PRD-04 | 2026-03-25 | Complete (11 wired, 0 stubbed) |
| PRD-05-repair.md | PRD-35 + PRD-36 | 2026-03-25 | Complete (14 wired, 0 stubbed) |
| PRD-05-LiLa-repair.md | PRD-05 | 2026-03-25 | Complete (10 wired, 0 stubbed, 1 N/A) |
| PRD-06-Guiding-Stars-Best-Intentions.md | PRD-06 | 2026-03-25 | Complete (42 wired, 11 stubbed) |
| PRD-07-InnerWorkings-repair.md | PRD-07 | 2026-03-25 | Complete (19 wired, 4 stubbed) |
| PRD-10-Widgets-Trackers-Dashboard-Layout.md | PRD-10 | 2026-03-25 | Complete |
| PRD-13-Archives-Context.md | PRD-13 | 2026-03-25 | Complete (80 wired, 14 stubbed) |
| PRD-21A-AI-Vault-Browse.md | PRD-21A | 2026-03-25 | Complete (74 wired, 14 stubbed) |
| PRD-21-Communication-Relationship-Tools.md | PRD-21 | 2026-03-26 | Complete (32 wired, 10 stubbed) |
| PRD-34-ThoughtSift.md | PRD-34 | 2026-03-26 | Complete — 3 sub-phases (34A: 42w/8s, 34B: 39w/4s, 34C: 48w/10s) |
| PRD-14-Personal-Dashboard.md | PRD-14 | 2026-03-30 | Complete (37 wired, 5 stubbed) — reconciliation build |
| PRD-17-Universal-Queue-Routing.md | PRD-17 | 2026-04-03 | Complete (30 wired, 7 stubbed) — gap-fill session |
| PRD-09A-09B-Studio-Intelligence-Phase-1.md | PRD-09A + PRD-09B | 2026-04-06 | Complete (27 wired, 0 stubbed) — sequential wiring fix + cross-surface visibility + capability tags foundation |
| PRD-18-Rhythms-Reflections.md | PRD-18 | 2026-04-07 | Complete — All 4 phases (A→B→C→D). Foundation + Guided mini evening + Enhancement Addendum items 1-8 + teen tailored experience. Conventions #168-197. |
| PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md | PRD-24 + PRD-26 | 2026-04-07 | Complete — Baby step (Sub-phases A-F). Play Dashboard + Sticker Book gamification write path. Conventions #198-207. |
| PRD-24-PRD-26-Configurable-Earning-Strategies.md | PRD-24 + PRD-26 | 2026-04-11 | Complete (42 wired, 12 stubbed) — Earning Strategies expansion (Phases 1-6). Task segments, 4 creature earning modes, 3 page earning modes, coloring reveals (32 subjects), cross-shell segments, gamification settings modal. Conventions #208-222. |
| PRD-23-BookShelf-Platform-Library-Phase1b.md | PRD-23 | 2026-04-08 (fully locked, 1b-A fresh-session kickoff cleared) | **FULLY LOCKED — 1b-A CLEARED TO KICK OFF** — Complete the platform migration Phase 1 left broken. 10 confirmed audit findings. 6 sub-phases A→F with founder gating. All 12 open questions resolved. Cache-hit uses title+author embedding only (no ISBN). `assign_book_to_family` RPC CUT — replaced with 4 documented SQL scripts in `docs/bookshelf-bulk-assign/` (by-collection, by-tag, by-title-list, from-source-family; all dry-run default, silent skip, pointer-create only). No Go Deeper stub. Dual-write through Phase 1b, 30-day soak, Phase 1c drop. Phase 1b runs BEFORE Build M. Predecessor: PRD-23-BookShelf-Platform-Library-Phase1.md. |
| PRD-16-Meetings.md | PRD-16 | 2026-04-15 | Complete (114 wired, 13 stubbed) — 5 phases A→E. 4 built-in meeting types + custom. 6 tables, 18 hooks, 8 components. LiLa facilitation via existing lila-chat. Universal Scheduler for recurrence. Post-meeting routing through Studio Queue. CompletedMeetingsSection wired in evening rhythms. Conventions #229-240. |
| PRD-09A-Routine-Propagation-Advance-Scheduling.md | PRD-09A + PRD-09B (lists deferred) | 2026-04-25 | Complete (37 wired, 1 stubbed, 0 missing) — Worker ROUTINE-PROPAGATION 8-commit landing. Advance-start gating + "Schedule to start later" toggle + master-template edit confirmation + duplicate-and-rename chooser flow + Scheduled-to-start badge + post-save toasts + overlap detection (founder D5 rescope) + lists deferral package. Migration 100176 (overlap trigger). 64/64 vitest. Convention #259 added (master template propagation contract). Companion docs: `Lists-Template-Deploy-Decisions-Needed.md` + `Shared-Assignment-Model-Worker-Handoff.md`. |
| Lists-Template-Deploy-Decisions-Needed.md | (dispatch package) | 2026-04-25 | **Complete** — All 6 decisions answered (D-L1: snapshot, D-L2: N/A, D-L3: no propagation, D-L4: simple duplicate, D-L5: skip scheduling, D-L6: no modal). Worker 4 shipped 2026-05-01. |
| Universal-Capability-Parity-Principle.md | PRD-09A/09B cross-cutting | 2026-04-29 | Design principle — universal capability surface, Configure Item editor, content edit timing, per-capability resolvers, sequencing. Governs all parity work. |
| Composed-View-Surfaces-and-Wishlists.md | (design intent) | 2026-04-29 | Out of scope — captures wishlist composed-view pattern, partial two-way editing, "Add as reward" promotion, multi-dimensional grouping. Post-MVP. |
| Master-Plans.md | (design intent) | 2026-04-29 | Out of scope — composable multi-faceted planning surfaces (homeschool planner, trip planner, etc.). Per-kid linked sources at step level. Post-MVP. Constrains current work for extensibility. |
| Shared-Assignment-Model-Worker-Handoff.md | (dispatch package) | 2026-04-25 | Awaiting Worker 2 SHARED-ROUTINES + Worker 3 SHARED-LISTS dispatch — Filed by Worker ROUTINE-PROPAGATION (D6 Thread 3). Captures founder spec verbatim, schema state today, what's missing per worker, pre-reqs landed, and 5+3 open questions each worker must surface to founder. |
| PRD-09A-Routine-Save-Fix.md | PRD-09A + Convention #259 | 2026-04-26 | Complete (3 commits, 42/42 vitest, tsc + prebuild clean) — Worker ROUTINE-SAVE-FIX. Resolves silent save failure when editing routines with completion history. c1: migration 100177 brings `routine_step_completions.step_id` into compliance with Convention #259 (NO ACTION → SET NULL). c2: `UndoToast` gains `variant: 'error'` (10s dwell, alert role) and all three save paths (`handleSave`, `handleSaveToStudio`, `handleEditConfirm`) gain catch blocks that surface failures via toast and keep the modal open. c3: `update_routine_template_atomic` RPC (migration 100178, SECURITY DEFINER, family-ownership RLS) consolidates createTaskFromData + Tasks.tsx:handleEditTask into one transactional rewrite path. Shared `serializeRoutineSectionsForRpc` helper. |
| Worker-5-Painter-Universal-Scheduler-Upgrade.md | PRD-35 + Connector Architecture | 2026-04-27 | Complete (8 sub-tasks, 0 missing) — Worker 5 in Connector Architecture multi-worker build. "Pick Dates" painted-calendar mode for Universal Scheduler. deed_firings table (connector event log, migration 100180). lists.schedule_config (migration 100181). fire-painted-schedules Edge Function + cron at :20 (migration 100182). Per-date assignee editor. Time-of-day window fields. "Active today" badge on list cards. Playwright visual verification (3/3 pass). |
| PRD-09A-Daily-Progress-Marking.md | PRD-09A Addendum | 2026-04-28 | Complete (47 wired, 8 stubbed, 0 missing) — Daily Progress Marking. Long Term Task type in creation picker. "Worked on this today" button on TaskCard/Guided/Play. DurationPromptModal with min/hr toggle. Soft-claim attribution + cross-claim warning + Done-blocked "Ask Mom" via PRD-15. Aggregation subtitle + cache invalidation + success toast. Track property inheritance across Paths A/B/C/E/F/G. List-level + per-item tri-state tracking defaults. 4 migrations (100183-100186). 13 Playwright tests. Conventions #260-265. 6 UT items pending multi-member verification. |
| PRD-23-Study-Guide-Rework.md | PRD-23 | 2026-05-01 | Complete — Replaces per-child Haiku study guides with on-demand Sonnet-from-chunks backfill. UPDATEs guided_text + independent_text columns on existing extraction rows (not separate rows). Audience toggle (Adult/Teen/Kid). Resume-safe (skips already-filled items). Migrations 100197-100198. Verified on Lion Witch & Wardrobe. |
