# Dispatch — FAMILY-OVERVIEW-COMMAND-CENTER session

> Paste everything below the line into a fresh Claude Code session.
> Prepared 2026-06-10 at founder request. Predecessors shipped: Role-Scoping
> Leak Pass (2026-06-09/10) + PERMISSIONS-WIRING (2026-06-09, Convention #274).

---

You are Worker FO-COMMAND-CENTER on MyAIM Central. This is a feature restructure build — full pre-build process per `claude/PRE_BUILD_PROCESS.md`: read all source material, create the feature decision file, create the active build file in `.claude/rules/current-builds/`, present the pre-build summary, and get explicit founder approval BEFORE any code. CLAUDE.md and `.claude/rules/` auto-load; honor every convention, especially:

- **#121** — `./node_modules/.bin/tsc -b` clean before declaring anything done
- **Migrations** — check `npx supabase migration list --linked` for the next free number FIRST (parallel sessions have collided; 100261 was the last known as of 2026-06-09); idempotent SQL; `npm run schema:dump` + stage `claude/live_schema.md` after applying
- **Theme tokens only**, Lucide icons, `<ModalV2>`, density classes; drag-to-reorder via @dnd-kit where order matters
- **Visual Verification Standard** — eyes-on desktop + 375px; **mobile/desktop nav parity** check if any sidebar entry changes (Convention #16: BottomNav More menu derives from `getSidebarSections`)
- **Playwright proof** — extend the pattern in `tests/e2e/permissions/role-scoping-leak-pass.spec.ts` (Testworth family, service-role fixtures, unique prefix, afterAll cleanup)
- **Stage only your own files** at commit time — parallel sessions share this working tree; check `git status` before any `git add`

## The founder's vision (THE LAW for this build)

Read `claude/feature-decisions/Family-Overview-Command-Center-Vision.md` first — it preserves her words verbatim. Summary:

**Family Overview becomes mom's command center.** Moving FROM the Tasks page TO Family Overview:
- Member spot-checking (the per-member deep view)
- The tab set she likes (My Tasks / Routines / Opportunities / Sequential as per-member category sections)
- Pending Approvals (including Build J mastery approvals — preserve the `completion_type='mastery_submit'` fork, Convention #161)
- The Queue tab (studio_queue decision inbox — preserve the 3-tab contract, Conventions #66/#146; the QuickTasks-strip queue modal entry point is a separate surface, decide its fate at the gate)
- Side-to-side member column scroll (ALREADY BUILT — keep)
- Member multi-select (ALREADY BUILT — keep) + NEW: category multi-select ("all selected categories for all selected people")

**Tasks page becomes purely personal:** the member's own items + the 13 prioritization views. NEW: routines, opportunities, and sequential items can be INCLUDED in the prioritization views alongside tasks (view metadata lives on `tasks` rows per Convention #68, so this is a display-filter inclusion control, not a schema change — design the control at the gate).

## Read first (full documents, not skims)

1. `claude/feature-decisions/Family-Overview-Command-Center-Vision.md` — founder vision verbatim + translation + cautions
2. PRD-14C (Family Overview) + `prds/addenda/PRD-14-Cross-PRD-Impact-Addendum.md`
3. PRD-09A (Tasks/views) + PRD-17 (Universal Queue) + their addenda per the PRE_BUILD_PROCESS addenda table
4. Existing code: `src/components/family-overview/FamilyOverview.tsx`, `src/hooks/useFamilyOverviewData.ts`, `src/hooks/useFamilyOverviewConfig.ts` (section keys: events, tasks, best_intentions, trackers, weekly_completion, opportunities, victories — you'll ADD routines + sequential), `src/pages/Tasks.tsx` (what's moving out), `src/components/queue/UniversalQueueModal.tsx`
5. `.claude/completed-builds/2026-06/role-scoping-leak-pass.md` + the PERMISSIONS-WIRING build file — the scoping/grants layer this build sits on (`useViewableMembers`, `viewableLevels`, Convention #274 sidebar options)

## Open decisions to surface at the founder gate (do NOT decide silently)

1. **Move vs duplicate:** do Approvals + Queue tab leave the Tasks page entirely (founder said "the task page should just be my page"), or keep the QuickTasks-strip queue-modal icon as the global quick entry? Recommendation: move the page tabs entirely; keep the strip's queue-modal icon (it's a modal, not a page surface) — confirm.
2. **Prioritization-view inclusion control:** how does mom include routines/opportunities/sequential in her 13 views — a per-view toggle set, one global "what counts as a task" preference, or pills on the view header? Mock 2 options.
3. **Family Overview access for granted dads:** FO is mom-only today (PerspectiveSwitcher). With PERMISSIONS-WIRING shipped, should a dad with grants get a scoped FO (his viewable members only, via `useViewableMembers`), or stay mom-only this build? Recommendation: scoped-FO is natural now but confirm scope appetite.
4. **Where does per-kid task EDITING live** after the move — inside the FO member column (inline) or deep-link to a scoped editor?
5. **Default section set + ordering** for the new routines/sequential sections in each member column.

## NOT in scope

- Tasks/Lists RLS hardening (Convention #39 migration point)
- Reflections revamp, My Rewards content, Special Adult Experience (separate queued builds)
- Any reduction of the 13 prioritization views — they are the Tasks page's core identity
- New gamification/reward surfaces

## Close-out

- `tsc -b` clean; lint no new errors; new Playwright suite green + `role-scoping-leak-pass.spec.ts` AND `permissions-wiring.spec.ts` still green (regression — this build touches the same Tasks surface)
- Post-Build Verification table (zero Missing) + Mom-UI table (desktop/tablet/375px) — FO is heavily layout-driven, so eyes-on matters more than usual; check the member-column horizontal scroll on mobile specifically
- Update `WIRING_STATUS.md`, feature-decisions file + README index, follow-up queue memory (item 11 → shipped), `BUILD_STATUS.md`
- Add `<FeatureGuide featureKey="family_overview" />` if the page identity changes materially; update LiLa knowledge (`help-patterns.ts` + `feature-guide-knowledge.ts`) so LiLa can explain the new command center
- Logical commits per phase; push at the end
