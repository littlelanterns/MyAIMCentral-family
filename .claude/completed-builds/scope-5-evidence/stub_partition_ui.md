# Scope 5 Partition — UI Components & Widgets

> **Domain:** React components, pages, widgets, wizards, modals, sections, UI flows. Anything whose primary identifier is a `.tsx` file or a UI surface.
> **Source:** `STUB_REGISTRY.md`.
> **Source checksum at dispatch:** 547 lines, 224 entries. Last-modifying commit: `c2e04e3` (2026-04-17 22:24). See `EVIDENCE_RECIPE.md` → "Registry integrity check" for the halt-on-drift protocol.
> **Count in this partition:** ~120 to-be-processed entries (largest partition).
> **Recipe:** `scope-5-evidence/EVIDENCE_RECIPE.md` — READ IN FULL before processing the calibration entry.
> **Output:** `scope-5-evidence/STUB_REGISTRY_EVIDENCE_UI.md`.

## Format

Each row: `STUB_REGISTRY.md line <N> | <Stub column from registry>`.

Sub-agent reads the full row from `STUB_REGISTRY.md` at the cited line number when processing.

**Rationale column stripped 2026-04-19.** Pilot review found categorization hints were wrong in ~40% of sampled cases. Trust the recipe's 4-level Identifier Extraction chain (including the (d.5) bounded-source-code-lookup step), not partition-file hints.

## Scale warning

Largest partition (~120 entries). Pacing: progress marker every 25-30 entries, HALT file check every entry. If context pressure hits mid-run, HALT cleanly and write remaining entries on the next dispatch — do not rush packets at the end of a long run.

## Calibration entry (process FIRST in this partition)

**Line 433 — `Sequential collection creation (end-to-end)`.**

Why this one: canonical "Looks Fine Failure" case. The stub row documents a past quiet failure — pre-Studio-Intelligence Phase 1, `SequentialCreator.tsx` + `SequentialCollectionView.tsx` existed but had zero callers, and every entry point silently opened `TaskCreationModal` which produced malformed single-row tasks. Registry claims ✅ Wired as of 2026-04-06. Rigorous packet must verify current state AND record historical context.

Expected evidence-packet content (founder's known-good answer — verified 2026-04-19 against the working tree):

- Field 1 (a) → multiple identifiers from stub row: `SequentialCreatorModal`, `useCreateSequentialCollection`, `SequentialCollectionView`, `createTaskFromData` (guard reference), `TaskCreationModal` (guard reference). Record all with source "stub entry line 433" (multi-identifier case per recipe).
- Field 2 grep for each identifier. Expected findings:
  - `SequentialCreatorModal` → `src/components/tasks/sequential/SequentialCreatorModal.tsx`.
  - `useCreateSequentialCollection` → `src/hooks/useSequentialCollections.ts:80` (named export in a multi-hook module; NOT a standalone hook file).
  - `SequentialCollectionView` → `src/components/tasks/sequential/SequentialCollectionView.tsx`.
  - `SequentialCollectionCard` → **named export from `SequentialCollectionView.tsx` around line 213, NOT a separate file**. Packet must note this explicitly. Callers: `src/pages/Lists.tsx` (imports at line 50, renders at line 277) AND `SequentialCollectionView.tsx:205`.
  - `createTaskFromData` → `src/utils/createTaskFromData.ts`. Guard at line 58 throws on `taskType === 'sequential'`.
  - `TaskCreationModal` → expected to `console.warn` skip on `initialTaskType === 'sequential'`.
- Field 3: Caller grep for `SequentialCreatorModal` should find entry points in Studio, Tasks, and Lists (three entry points per registry row). Last-touching commits date to 2026-04-06 or later.
- Field 4: PRD-09A/09B Studio Intelligence addendum describes the pattern. E2E test spec `tests/e2e/features/studio-intelligence-phase1.spec.ts` should exist. CLAUDE.md conventions 151-156 describe the guard architecture.
- Field 5: Record that E2E tests were NOT executed — only spec-file existence was confirmed.
- Field 6 neutral summary: multi-identifier entry; all identifiers located in expected paths; three entry points confirmed; guard clauses present; historical zero-caller failure pattern resolved per registry row claim. No verdict.

If the packet claims `SequentialCollectionCard.tsx` doesn't exist as a separate file and fails to identify it as a named export within SequentialCollectionView, THAT's the red flag — classic "file-not-found, no evidence" premature conclusion. Correct packet identifies it at `SequentialCollectionView.tsx:213`.

Process this entry first. Founder compares your calibration packet against the expected content above before approving the partition for full run.

## Entries (to-be-processed)

| Line | Stub identifier |
|---|---|
| 23 | PIN verification (FamilyLogin) |
| 24 | Accept-invite flow (/auth/accept-invite) |
| 26 | Inactivity warning banner |
| 27 | Family device hub widgets |
| 29 | Permission hub UI |
| 30 | Transparency panel (mom side) |
| 31 | Teen transparency panel (teen side) |
| 33 | View As full-shell mode + banner |
| 35 | Special Adult Shift View |
| 43 | SA Log Activity form during shifts |
| 44 | Admin user management |
| 51 | HumanInTheMix Regenerate/Reject |
| 58 | Person-level context toggles (UI) |
| 59 | Conversation history date filter |
| 66 | Tool permission management UI |
| 75 | Library Vault tutorial links |
| 77 | Edit in Notepad action chip |
| 78 | Review & Route action chip |
| 79 | Create Task action chip |
| 80 | Record Victory action chip |
| 89 | Dashboard widget containers |
| 97 | Dashboard widget for GS rotation |
| 102 | Dashboard widget for BI celebration |
| 103 | Bar graph tracker visualization |
| 104 | Streak tracker visualization |
| 106 | Teen privacy indicator |
| 110 | Review & Route routing UI |
| 113 | Send to Agenda |
| 118 | Family Celebration mode |
| 121 | Context export for external AI |
| 127 | LifeLantern aggregation in Archives |
| 128 | Family Vision Statement in Family Overview |
| 131 | Shared Lists aggregation in Archives |
| 132 | Journal entries aggregation in Archives |
| 138 | Context staleness indicators |
| 141 | "Open in Notepad" from Context Export |
| 142 | Usage count display in Archives UI |
| 151 | Content Corner link preview |
| 156 | Guided "Things to Talk About" capture widget |
| 164 | Queue Modal future tabs |
| 175 | PRD-18 Phase A: evening_tomorrow_capture placeholder |
| 176 | PRD-18 Phase A: morning_priorities_recall placeholder |
| 177 | PRD-18 Phase A: on_the_horizon placeholder |
| 178 | PRD-18 Phase A: periodic_cards_slot returning null |
| 179 | PRD-18 Phase A: carry_forward per-task triage section |
| 180 | PRD-18 Phase A: routine_checklist placeholder |
| 181 | PRD-18 Phase A: task_preview in adult/Guided morning |
| 182 | PRD-18 Phase A: encouraging_message placeholder |
| 183 | PRD-18 Phase B: mindsweep_lite placeholder |
| 184 | PRD-18 Phase B: morning_insight placeholder |
| 185 | PRD-18 Phase B: feature_discovery placeholder |
| 186 | PRD-18 Phase B: rhythm_tracker_prompts auto-hide |
| 188 | PRD-18 Phase B: before_close_the_day auto-hide |
| 189 | PRD-18 Phase B: completed_meetings auto-hide |
| 190 | PRD-18 Phase B: milestone_celebrations auto-hide |
| 191 | PRD-18 Phase B: Weekly/Monthly Review deep dive button |
| 192 | PRD-18 Phase B: Quarterly Inventory Stale Areas / LifeLantern launch |
| 193 | PRD-18 Phase B: On the Horizon "Schedule time for this?" calendar block |
| 201 | ThoughtSift name → External Tool Suite |
| 207 | AI Vault sidebar navigation |
| 208 | AI Toolbox browsing/assignment |
| 209 | Library Vault tutorial links from LiLa Assist |
| 212 | Embedded tool iframe delivery |
| 213 | Native AI tool LiLa modal launch |
| 214 | Vault recommended dashboard widget |
| 217 | Section C: Recommended for You |
| 219 | PRD-21B Admin content management UI |
| 220 | PRD-21C Engagement (hearts, comments, discussions) |
| 223 | UpgradeModal (tier gating prompt) |
| 229 | Book social sharing |
| 244 | Drag-to-reposition creatures on sticker pages |
| 245 | Sticker book page curation UI |
| 246 | Currency customization UI |
| 248 | DailyCelebration Step 3/4 gamification wiring |
| 249 | Play Dashboard mom message widget |
| 250 | Play Dashboard reveal tiles |
| 261 | Cross-shell segment rendering |
| 262 | Gamification settings modal (6 sections) |
| 263 | Mystery tap tile + show upfront tile |
| 264 | Redraw button (adult-only, math gate) |
| 265 | First-time setup wizard |
| 283 | System design trial expiration UI |
| 285 | Community persona moderation queue |
| 286 | Community lens moderation queue |
| 303 | Per-family AI cost drill-down |
| 304 | Admin activity log |
| 312 | Calendar week/month toggle on Family Overview |
| 313 | Column drag-to-reorder (dnd-kit on headers) |
| 314 | Section per-column override (long-press gesture) |
| 315 | Section drag-to-reorder (dnd-kit on section headers) |
| 321 | Celebrate section |
| 322 | DailyCelebration Reflections Step 2.5 |
| 323 | Victories page (Guided) |
| 324 | Progress page (Guided) |
| 325 | Gamification header indicators |
| 326 | Task point values |
| 327 | Messages tab in Write drawer |
| 328 | Unread message badge on Write button |
| 330 | LiLa Homework Help modal |
| 331 | LiLa Communication Coach modal |
| 332 | Visual World theme skinning |
| 333 | Gamification widgets in grid |
| 334 | Graduation celebration + tutorial |
| 344 | Universal Scheduler UI component |
| 351 | Universal Timer UI (all 4 modes) |
| 352 | Floating timer bubble (all 5 shells) |
| 353 | 5 visual timer styles (SVG/CSS) |
| 354 | Timer session history + editing |
| 355 | Play mode age gate + visual timer |
| 356 | Timer config panel (per-member) |
| 358 | Theme-adaptive Tooltip |
| 359 | 11 shared components (Button, Card, etc.) |
| 360 | SparkleOverlay (Play victories) |
| 363 | Shell-aware BottomNav |
| 364 | QuickTasks strip |
| 365 | PerspectiveSwitcher (dashboard) |
| 366 | Play shell Celebrate button |
| 367 | Guided shell personalized header |
| 368 | Notepad in Adult/Independent shells |
| 369 | Settings removed from Sidebar |
| 370 | Guided lightweight notepad |
| 371 | Settings overlay (full UI) |
| 372 | Hub widget content (real widgets) |
| 378 | Visual World themed timer animations |
| 384 | Studio Browse tab (template cards) |
| 385 | Studio My Customized tab |
| 386 | Studio [Customize] → Task types |
| 387 | Studio [Customize] → List types |
| 388 | Studio [Customize] → Guided Forms |
| 389 | Studio [Customize] → Trackers/Widgets |
| 391 | Lists full CRUD (9 types) |
| 392 | Lists Randomizer draw view |
| 393 | Lists promote-to-task |
| 394 | Guided Form assign modal |
| 395 | Guided Form child fill view |
| 396 | Guided Form mom review view |
| 397 | Guided Form LiLa help button |
| 399 | ListPicker overlay (Notepad → Lists) |
| 400 | List drag-to-rearrange (@dnd-kit) |
| 401 | Save list as template to Studio |
| 402 | List item promotion badge |
| 408 | Dashboard grid + 6 tracker types |
| 409 | Widget Picker modal |
| 410 | Widget Configuration modal |
| 411 | Widget Detail View modal |
| 412 | Widget folders (create/view) |
| 414 | Phase B tracker types (11 remaining) |
| 416 | Track This flow (Screen 5) |
| 418 | Gameboard tracker |
| 420 | Special Adult child-widget view |
| 421 | Decorative layer (Cozy Journal) |
| 430 | Task creation modal redesign (compact 2-col) |
| 432 | Task view drag-to-reorder |
| 433 | **CALIBRATION** — Sequential collection creation (end-to-end) |
| 434 | Sequential reuse/redeploy flow |
| 435 | Routine step progress indicator |
| 436 | Approval-required parent UI |
| 437 | Completion photo evidence |
| 439 | Batch Process All progress bar |
| 441 | Breathing glow vs badge toggle |
| 442 | HScrollArrows on ViewCarousel |
| 443 | Emoji removed from task views |
| 444 | External attribution removed |
| 457 | Community persona moderation queue |
| 458 | Community lens moderation queue |
| 459 | Full persona library browse page (categories/filtering) |
| 463 | Custom lens creation UI |
| 464 | Custom lens sharing to community library |
| 465 | Decision Guide: user-created custom frameworks |
| 466 | Guided-shell simplified ThoughtSift versions |
| 468 | Route to BigPlans action chip (Decision Guide + BoD) |
| 470 | Send via Message action chip (Mediator) |
| 471 | @Name addressing UI parsing in BoD |
| 472 | Suggested for This Situation in persona selector |
| 473 | Long-press persona preview card |
| 475 | Recently Used section in persona selector |
| 486 | `SequentialCreatorModal` wrapper |
| 487 | `SequentialCollectionCard` exported for cross-page use |
| 488 | Sequential visible on Lists page (grid + list view) |
| 489 | Sequential creation entry from Lists [+ New List] |
| 490 | Randomizer in Lists [+ New List] type picker grid |
| 499 | Routine duplication with linked step resolution |
| 501 | Sequential mastery approval in global queue |
| 502 | Randomizer mastery approval inline on Lists detail view |
| 503 | Per-item advancement override editor in SequentialCollectionView |
| 504 | Evidence file upload (camera integration) for mastery submissions |
| 505 | Linked routine step child-dashboard rendering |
| 506 | "What do you want to create?" Studio search bar |
| 507 | Use case category browse in Studio |
| 508 | Enhanced Studio cards with capability tag pills |
| 509 | Studio "My Library" cross-table unified tab |
| 510 | Post-creation smart recommendation cards |
| 516 | Subject Tracking section in TaskCreationModal |
| 522 | Allowance history trend charts |
| 535 | Safe Harbor placeholder UI + ViewAs exclusion |

## Ambiguous entries — ADVISORY ONLY, do NOT process twice

All entries below are in the to-be-processed table above.

- **Line 186** — schema-shaped (`dashboard_widgets.config.rhythm_keys` multi-select) + UI selector. Kept UI because the configurable selector is the observable surface.
- **Line 433 + 434** — heavy backend hook + UI modal/view. Kept UI because the component is the verification anchor. **Line 433 is this partition's calibration entry.**
- **Line 535** — placeholder component + `PRIVACY_EXCLUSIONS` constant. Kept UI because the PlannedExpansionCard is the observable stub surface.

If the same line number appears in another partition's to-be-processed table, STOP and report the conflict under a `## CROSS-PARTITION CONFLICT` heading.

## Out of scope for this partition

Entries whose primary identifier is a DB object, Edge Function, or hook belong elsewhere. Record partition mismatch and move on.
