# Build History — MyAIM Central

> Append-only log of build closures and baton-passes.
> Updated by the orchestration layer at every close-out (Checkpoint 6).
> For the current state snapshot, see `CURRENT.md`.

---

## 2026-06-08 — Member-Day Task State (Single Source of Truth) CLOSED

**Type:** Architectural refactor + money-math bug fix + named convention (#271)
**Scope:** Fix silent allowance erosion from past-end-date painted routines; establish one canonical query for "what counts for a member on a date."
**Duration:** Single session, single worker (build order steps 1–13).
**Final state:** Checkpoint 5 audit 12/12 Wired, 0 Missing, 3/3 Discipline-2 prod checks pass. Invariant test 19/19 deterministic. Founder eyes-on confirmed phantom routines gone on affected weeks.
**Commit:** `6143b5a` (pushed to main). Migration `00000000100247` applied to production.

### What shipped
- **Layer 1 `obligation_active_for_member_on_date(task, member, date)→bool`** — atomic activity predicate; mirrors `src/lib/tasks/recurringTaskFilter.ts` exactly (painted rdates/exdates, until, dtstart, archived, created, assignee direct+via task_assignments, RRULE day-membership). SECURITY DEFINER.
- **Layer 2 `get_member_day_obligations(member, start, end)→TABLE`** — public canonical query. Auth guard admits service_role + same-family authenticated members. `source_type='routine_step'` this build; return shape **pre-carries** `pool_id`, `task_segment_id`, `is_extra_credit`, `homework_subject_ids` (Checkpoint-1 lock) so future reward surfaces refactor in without amending the signature.
- **3 callers refactored:** `useRoutineWeekView` (→ Layer 2), `calculate-allowance-period` Edge Function `countAssignedTasks` (→ Layer 2, redeployed `--no-verify-jwt`), `calculate_allowance_progress` (gates each day + completion through Layer 1 — faithful realization of D3 accepted at Checkpoint 2; preserves all prior fairness logic 100243/100244/100239/100241/100235 + grace days).
- **Convention #271** added to CLAUDE.md (dashboard-truth invariant + privacy boundary + grandfathered-surfaces list).
- **Invariant test** `tests/routine-day-state-invariant.test.ts` — asserts SQL Layer 1 == TS reference across a 30-day synthetic corpus; fails CI on drift.
- **Data:** backfilled `until` on 3 painted production rows; archived 1 orphan Kitchen Zone row (`c06c706c…`).

### Checkpoint-1 locks (founder, 2026-06-08)
1. Broad canonical names everywhere (stale `..._routine_steps_...` superseded).
2. D2 return shape expanded by 4 grouping fields (pool_id, task_segment_id, is_extra_credit, homework_subject_ids).
3. D3 Layer-1 substitution accepted (gates through canonical predicate; preserves fairness math).

### Viewport decision
Tablet/Mobile eyes-on waived for cause — data-only change, no layout modification (founder: "more of a data issue, not physical or visual"). Desktop confirmed.

### Open follow-ups (non-blocking)
- Founder continued testing through the current week.
- Capture per-kid old→corrected allowance deltas (Gideon/Miriam/Mosiah); decide honor-old-vs-corrected per kid. **Default: corrected.**
- **Grandfathered surfaces** (Convention #271) refactor into `get_member_day_obligations` when next touched: `roll_creature_for_completion`, homework time logs, victory creation, tracker widget events, intention tallies, practice log, non-routine task derivations, and `countAssignedTasks` non-routine portion.
- Future builds extend Layer 2 to non-routine `source_type` values (one per build).
- Separate sweep: find/prevent the deploy flow that created the orphan `assignee_id=NULL` row.

**Archived:** `.claude/completed-builds/2026-06/member-day-task-state-canonical-source.md`

---

## 2026-05-05 — Phase 3.8 Activity Management CLOSED

**Type:** Cross-PRD infrastructure build (Connector Architecture §3.8)
**Scope:** Per-item recurrence, Activity List wizard, Honey-Do wizard, Play/Guided/Independent surfaces, deploy-target picker, NLC routing, reveal animation picker, Task Breaker Vault fix
**Duration:** Single long session (5 workers: A→B+D parallel→C→E + 2 bugfix passes)
**Final state:** 68/68 requirements verified. 21+ Playwright tests pass. 3 migrations (100231-100233) applied to production.
**Commits:** `070f6ef`, `8fcf0fe`, `c54c152`, `43dd723`, `897b79a`, `8495b29`

### What shipped
- **Worker A:** ItemRecurrenceConfig (3-mode segmented control: one-time/recurring/always), wired into ListRevealAssignmentWizard + list detail views. Task Breaker Vault fix: `guided_mode_key=NULL` on vault_items, routes to StandaloneTaskBreakerModal. Migration 100231.
- **Worker B:** ActivityListWizard (6 steps: subject name + icon picker → activities with BulkAddWithAI + recurrence → display mode Random/Browse/Sequential-with-browse → daily floor → rewards per-subject/combined → assign). DualModeListAccess toggle. 2 seeded templates (Reading Fun Activities, Homeschool Variety Pack). `icon_launcher` widget type registered.
- **Worker C:** Play dashboard IconLauncherGrid/Tile with tap→draw→ActivityRevealCard (sparkle reveal→Claim/Dismiss with MathGate). ActivityBrowseModal for browse mode. GuidedActivitySection with DualModeListAccess toggle. IndependentActivityCard. useIconLauncherWidgets hook.
- **Worker D:** SharedTaskListWizard (5 steps: name → items with BulkAddWithAI + recurrence + big-job flag → share with adults → claim behavior → deploy). Claim-to-task auto-promotion in useClaimListItem. Completion write-back in useCompleteTask. Honey-Do seeded template.
- **Worker E:** Deploy-target picker refactored Step 6 — 3 targets per kid (routine step via linked_randomizer, segment tile, dashboard card with icon_card/text_button). RoutinePicker + SegmentPicker components. Visual style fork in IconLauncherGrid + GuidedActivitySection. NLC routing for both new wizard types.
- **Bugfix migration 100232:** Extended tasks_source_check (added list_promotion, icon_launcher, activity_list). Rebuilt contracts_unique_kid_override_idx with source_category.
- **Post-build fixes migration 100233:** allow_out_of_order on sequential_collections. 3 feature keys. Reveal animation picker in ActivityListWizard. IndependentActivityCard wired into Dashboard.tsx. 5 stubs in STUB_REGISTRY.md.

### Bugs found and fixed during E2E testing
1. tasks_source_check missing 3 new source values — blocking all 3 creation flows
2. contracts_unique_kid_override_idx too narrow — blocking per-subject reward contracts
3. Test auth missing on Worker B+D tests — not a code bug
4. Studio card locator fragility in tests — not a code bug
5. Activity List seeded template cards missing from studio-seed-data.ts — fixed during Worker B checkpoint

---

## 2026-05-04 — Phase 3.7 Wizards & Seeded Templates CLOSED

**Type:** Phase build (Connector Architecture §8)
**Scope:** Three outcome-named wizards + three seeded templates + NLC entry point + Drafts tab + draft persistence infrastructure
**Duration:** Single session (Workers A-E sequential)
**Final state:** All requirements verified. 6/6 Playwright tests pass. Migration 100229 applied to production.
**Commit:** `0f7457b`

### What shipped
- Migration 100229: wizard_templates table, reveal_animation_pools + pool members, reveal_animations.tag column, godmother_type CHECK restoration (all 13 types), ListType CHECK extension (reward_list)
- **Rewards List Wizard** — "Create a Rewards List" (4 steps): name → add items with BulkAddWithAI → configure reveal → assign to kids
- **Repeated Action Chart Wizard** — "Set Up a Progress Chart" (6 steps): name → pick visual (star chart/coloring reveal) → add items → set milestones → configure rewards → assign
- **List + Reveal + Assignment Wizard** — two flavors: "Extra Earning Opportunities" (opportunity, 6 steps) and "Consequence Spinner" (draw, 7 steps)
- **Potty Chart** seeded template (pre-fills Repeated Action Chart wizard)
- **Consequence Spinner** seeded template (pre-fills draw flavor)
- **Extra Earning Opportunities** seeded template (pre-fills opportunity flavor)
- **Natural Language Composition** entry point on Studio Browse tab
- **Drafts tab** in Studio with localStorage persistence via `useWizardDraft`
- TypeScript `GodmotherType` union fix (4 missing types added)
- 6 Playwright E2E tests

### Bugs found during Playwright testing (all fixed)
1. Hidden seeded templates — card visibility logic excluded them
2. Missing headings — wizard step headings not rendering
3. Draft save failure — localStorage serialization error
4. Card title mismatch — seeded template cards showing wrong names

---

## 2026-04-28 — Daily Progress Marking CLOSED

**Type:** PRD-driven build (PRD-09A Addendum)
**Scope:** "Worked on this today" for multi-day tasks + routine steps, optional duration capture, soft-claim, aggregation display, Long Term Task type
**Duration:** Single long session (orchestrator + executor combined)
**Final state:** All addendum §12 requirements verified. 13 Playwright tests pass. 8 stubs filed.
**Commits:** 617c44a, e6d3f64, 1e59840, 7a5e985, 3350dda, f207e99 + close-out commit

### What shipped
- 4 migrations (100183-100186): track_progress, in_progress_member_id, list defaults, CHECK extension, feature keys
- Long Term Task as first-class Task Type in the creation picker
- "Worked on this today" button on TaskCard (standard, Guided, Play variants)
- DurationPromptModal with 6 chips + min/hr custom input + skip
- Soft-claim authorization + cross-claim warning + Done-blocked modal + "Ask Mom" via PRD-15 family_requests
- Aggregation subtitle: "N sessions · X hours" with cache invalidation + success toast
- Track property inheritance across Paths A (opportunity claim), B (routine step), C (list promotion), E (direct creation), F (rhythm capture), G (MindSweep sort)
- List-level tracking defaults + per-item tri-state overrides
- resolveTrackingProperties(), checkSoftClaimAuthorization(), formatPracticeAggregation() helpers
- Emoji convention updated: no emoji anywhere including Play shell
- 6 CLAUDE.md conventions added (260-265)

### 9 post-sub-task-12 discoveries (eyes-on review findings)

1. **Phantom feature gate.** `useCanAccess` on newly-registered feature keys returned false despite `feature_access_v2` rows existing — cache/timing issue. Fix: don't gate creation-time toggles on useCanAccess; gate at the type-picker level instead (picking Long Term Task IS the toggle).
2. **Task Type vs Advanced toggle.** A structurally different kind of task deserves a first-class type, not a buried checkbox. Convention 260 codifies this.
3. **Vercel config.toml gap.** Worker 5's Edge Function shipped without a config.toml entry. Pre-existing, blocked deploy.
4. **Grid layout orphan.** Odd number of tiles in a 2-column grid leaves one half-width alone. Moving List into the grid array fixed it.
5. **Prop not threaded through DnD wrapper.** `onWorkedOnThis` was threaded through 8 layers of components correctly but missed at the `<SortableTaskItem>` JSX call site. Convention 262 codifies the full threading checklist.
6. **Minutes-only custom input.** Users type hours, not 480-minute values. Added min/hr segmented toggle.
7. **Missing cache invalidation for aggregations.** Mutation invalidated the parent entity key but not the aggregation query key. Convention 261 codifies this.
8. **No success feedback.** Practice log write succeeded silently. Added toast confirmation.
9. **Incorrect PRD-15 deferral.** `useCreateRequest` was fully operational since Build G. "Ask Mom" wired to fire a real request instead of stubbing.

### Patterns worth watching in future builds
- **Phantom feature gate:** newly-registered feature keys may not resolve on first render. Don't gate creation-time UI on useCanAccess for new features in the same build.
- **DnD wrapper call-site gap:** SortableItem wrappers render their child component — any new prop on the child must also appear at the wrapper's JSX call site, not just in its interface.
- **Aggregation key discipline:** if you add a new aggregation query, grep for every mutation that feeds it and add the invalidation at each site.
- **Deferred deferral:** before filing a "PRD-XX not ready" stub, grep the codebase to check if the infrastructure already shipped.

### Spec observations for future sessions
- Single-window combined orchestrator+executor worked well for this build size (12 sub-tasks, sequential, single coherent surface). For Workers 2+3 (multi-surface, more concurrent decisions), multi-window separation is likely better. Spec needs to clarify when single-window is appropriate vs multi-window separation.

---

## 2026-04-27 — Conductor Session: Connector Architecture Orchestration + Worker 5 + Daily Progress Marking Scoping

**Type:** Multi-phase conductor session (Plan Mode → Execute Mode → Plan Mode pivot)
**Duration:** Single long session covering orchestration setup, Worker 5 dispatch/monitoring, Workers 2+3 scoping, and Daily Progress Marking pivot

### What shipped
- **Worker 5 (Painter / Universal Scheduler Upgrade)** — commits 3f0b802 + 6775e09. Pick Dates mode, deed_firings table, fire-painted-schedules Edge Function + cron, per-date assignee editor, time-of-day windows, Active today badge on list cards. 8 sub-tasks, all signed off.
- **Connector architecture design docs** — orientation prompt, coordination brief (with verb-form lock §2.10 and deed-firings table ownership updates), build plan updates, Worker 5 dispatch prompt, Worker 5 review checklist.
- **Orchestration state infrastructure** — CURRENT.md, HISTORY.md, orchestration artifacts.

### What was scoped but paused
- **Workers 2+3 (Shared Routines + Shared Lists)** — full scoping complete: 8 founder questions answered, two discovery passes (practice/mastery infrastructure status + list claim semantics), bug reports triaged for adjacent surfaces, borderline items identified. Paused for Daily Progress Marking detour. Preserved at `.claude/rules/current-builds/workers-2-3-shared-routines-lists-PAUSED.md`.

### What was scoped for next session
- **Daily Progress Marking (PRD-09A addendum)** — addendum authored by founder, Q1-Q6 answered and locked, pre-build notes saved. Dispatch prompt generated for fresh orchestrator session.

### Observations
- **Verb-form source_type lock was the right call.** Pre-parallel investigation surfaced the three-style naming gap; locking before workers shipped prevented migration churn. Convention §2.10 added to Coordination Brief.
- **Deed-firings table ownership shift to Worker 5 was the right call.** Worker 5 shipped the table and wrote real firings; Phase 3 inherits rather than creates. Painted-day firings are observable immediately.
- **Discovery pass depth matters.** First discovery for Workers 2+3 missed the Build J practice/mastery infrastructure gap (schema existed but UI was partially unwired). Second pass caught it. This drove the Daily Progress Marking detour — planning-side review caught what execution-side wouldn't have.
- **The "two-fires" triage pattern works.** Bug reports + triage worksheet cross-reference surfaced 4 bug reports adjacent to Workers 2+3 surfaces (routine lifecycle, Herringbone duplicates, overdue-past-end-date). Folding them into Workers 2+3 scope prevents separate bug-fix passes on the same surfaces.
- **Dispatch prompt framing matters.** Initial dispatch prompt framed the next session as a "worker with locked scope" — founder corrected to "orchestrator adopting the role for the entire build." The orchestration layer's design is that every fresh session IS the orchestrator; there's no separate long-lived coordinator.

### Commits this session
- `9dc7a60` — docs: connector architecture plans, Daily Progress Marking addendum, orchestration state (13 files, 5098 insertions)
- `0a592ce` — feat: orchestration layer infrastructure (pre-existing, from parallel work)
- Worker 5 commits monitored but authored in separate session: `3f0b802` + `6775e09`

### Next session
Fresh orchestrator session dispatching Daily Progress Marking build. Dispatch prompt at `claude/web-sync/Daily-Progress-Marking-Dispatch-Prompt.md`. After that build closes, Workers 2+3 resumes.
