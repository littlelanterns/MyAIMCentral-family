# Build H: PRD-09A/09B Studio Intelligence Phase 1 — Sequential Wiring Fix + Cross-Surface Visibility + Capability Tags

### PRD Files
- `prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md`
- `prds/personal-growth/PRD-09B-Lists-Studio-Templates.md`

### Addenda Read
- `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` (**primary authoritative source for this build — Phase 1 scope only**)
- `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` (read for Session 2 context — NOT building this session)
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`
- `prds/addenda/PRD-Template-and-Audit-Updates.md`
- `specs/studio-seed-templates.md` (founder-authoritative Studio five-layer mental model)
- `specs/Concept-Capture-Shopping-List-Backburner-Victory.md` (forward concept capture — not in scope)

### Feature Decision File
`claude/feature-decisions/PRD-09A-09B-Studio-Intelligence-Phase-1.md`

### Build Plan
Session 1 of a three-session sequence:
- **Session 1 (this build):** Fix broken sequential creation wiring, randomizer on Lists page, sequential cross-surface visibility, capability tags foundation on Studio seed data.
- **Session 2 (next):** Linked Steps / Mastery / Advancement addendum — advancement modes, `practice_log` + `randomizer_draws` tables, linked routine steps, `curriculum-parse` Edge Function, Reading List template, routine duplication.
- **Session 3 (after):** Studio Intelligence Phase 2 — "What do you want to create?" search bar, use case categories, enhanced template cards, "My Library" tab, post-creation recommendations.
- **Phase 3 (forward note, not scheduled):** LiLa `studio_create_guide` conversational creation mode. Depends on PRD-05, PRD-18, PRD-29.

---

### Pre-Build Summary

#### Context

The PRD-09A/09B audit discovered that sequential collection creation is **broken everywhere**. Fully-built dead-code components (`SequentialCreator.tsx`, `SequentialCollectionView.tsx`, `useCreateSequentialCollection` hook) exist but have zero callers in src/. The `sequential_collections` table has **0 rows** in the live database (confirmed in `claude/live_schema.md` line 757). Every current "Create Sequential" entry point opens `TaskCreationModal` with `initialTaskType='sequential'`, which silently writes a malformed single row to the `tasks` table with no children and no `sequential_collections` entry.

Additionally, the `Lists.tsx:357` hard-coded type picker grid excludes `'randomizer'` even though `RandomizerDetailView`, the `Randomizer` component, and the `TYPE_CONFIG` entry all exist. Randomizer creation works only via the Studio → `/lists?create=randomizer` URL-param backdoor.

This build is a deliberate architectural evolution from PRD-09A line 469's original ruling ("Sequential collections need their own tab because the management experience is unique"). Per the Studio Intelligence addendum, sequential collections will now be visible on **both** the Tasks → Sequential tab AND the Lists page. Mom thinks of sequential collections as "lists of content for my kids," not "task-system items." Dual access, not migration. The rich management experience (`SequentialCollectionView`) is the primary rendering on both surfaces. Studio remains the universal creation library. The capability tags added this session are the data foundation for Session 3's intent-based Studio search.

**No database migrations. No new tables. No new columns. Phase 1 is 100% frontend wiring plus a seed data config update.**

#### Dependencies Already Built
- `sequential_collections` table (live schema line 757) — 14 columns, 0 rows
- `useCreateSequentialCollection` hook (`src/hooks/useSequentialCollections.ts:80-165`) — fully functional mutation
- `useSequentialCollection` hook — fetches collection + child tasks + active task
- `useSequentialCollections` hook — lists all collections for a family
- `useRedeploySequentialCollection` — restart-for-another-student flow
- `SequentialCreator.tsx` — full creation UI with title, manual/URL/image, items textarea, BulkAddWithAI integration, promotion timing, active count. **Zero callers in src/**.
- `SequentialCollectionView.tsx` — full management view with progress bars, active item highlighting, restart-for-another-student, archive, member picker modal. **Zero callers in src/**.
- `TaskCreationModal.tsx` — accepts `initialTaskType` prop (line 107, 401), assigns to state (line 412, 437)
- `createTaskFromData.ts` — shared task creation utility used by 4 shells
- `Lists.tsx` — `TYPE_CONFIG` includes `randomizer`, `RandomizerDetailView` rendered when `list_type='randomizer'`, `?create=` URL param path (lines 157-164)
- `Studio.tsx` — `handleCustomize` with sequential branch (lines 223-228) currently routing to TaskCreationModal
- `studio-seed-data.ts` — `TASK_TEMPLATES_BLANK`, `TASK_TEMPLATES_EXAMPLES`, `GUIDED_FORM_TEMPLATES_BLANK`, `GUIDED_FORM_TEMPLATES_EXAMPLES`, `LIST_TEMPLATES_BLANK`, `LIST_TEMPLATES_EXAMPLES`, `RANDOMIZER_TEMPLATE_BLANK`. Sequential blank template at `sys_task_sequential` (line 66).
- `StudioTemplate` type — defined in `StudioTemplateCard.tsx`
- `BulkAddWithAI` component — already wired inside `SequentialCreator` (lines 163-179) for AI parse of table-of-contents
- `useLists` hook — simple `.from('lists').select('*').eq('family_id', familyId)` query, returns `List[]`
- `useFamily`, `useFamilyMember`, `useFamilyMembers` hooks — for context
- `ModalV2` component — for the new `SequentialCreatorModal` wrapper
- Live randomizer infrastructure: `Randomizer` component, `RandomizerDetailView`, `lists.list_type='randomizer'` support in all CRUD hooks

#### Dependencies NOT Yet Built
- **Session 2 scope (read for context only, NOT built this session):**
  - Advancement mode columns (`advancement_mode`, `practice_target`, `practice_count`, `mastery_status`, etc.) on `tasks` and `list_items`
  - `practice_log` table
  - `randomizer_draws` table
  - `resource_url` column on `tasks`
  - Default advancement columns on `sequential_collections`
  - `draw_mode` column on `lists`
  - Linked routine steps (`step_type` enum on `task_template_steps`)
  - `curriculum-parse` Edge Function
  - Reading List Studio template
  - Routine duplication with linked step resolution
- **Session 3 scope (Phase 2):** "What do you want to create?" search bar, use case categories, enhanced template cards rendering capability tags, "My Library" tab, post-creation smart recommendation cards
- **Phase 3 scope (forward note):** LiLa `studio_create_guide` mode, conversational school year planner, proactive Studio suggestions
- **Captured concepts (not scheduled):** Living shopping list enhancement, backburner activation as victory

#### Build Items (Phase 1 — 14 items, 4 sub-phases)

**Sub-phase 1A: Revive dead sequential creation code + guard broken path (7 items)**
1. Create `src/components/tasks/sequential/SequentialCreatorModal.tsx` — tiny ModalV2 wrapper around the existing `SequentialCreator` component. Accepts `isOpen`, `onClose`, `familyId`, `createdBy`, `assigneeId` (optional), `onSaved` callback. Internally calls `useCreateSequentialCollection().mutateAsync()` with the shape: `{ collection: {family_id, title, promotion_timing, active_count}, items: [{title}], assigneeId, createdBy }`. Reused from Studio, Tasks page, and Lists page — single source of truth for the creation modal shell.
2. Update `TaskCreationModal.tsx` `useEffect` that assigns `initialTaskType` (lines 412 and 437) to skip `'sequential'` — log a `console.warn` if encountered, do not assign to state. This is a defensive change; the proper fix is the guard in step 3.
3. Add guard clause at top of `createTaskFromData()` in `src/utils/createTaskFromData.ts` — if `data.taskType === 'sequential'`, throw `new Error("Sequential collections must be created via useCreateSequentialCollection, not createTaskFromData. This is a bug — check the caller.")`. Prevents silent re-introduction of the broken path.
4. Update `Studio.tsx` `handleCustomize` branch for `sequential` template type (currently lines 223-228): instead of setting `modalInitialType='sequential'` and opening TaskCreationModal, open the new SequentialCreatorModal. Add `sequentialModalOpen` state.
5. Update `Tasks.tsx` `SequentialTab` `onCreate` handler (line 493 wiring): open the new SequentialCreatorModal instead of `setShowCreateModal(true)` (which opens TaskCreationModal). Add `sequentialModalOpen` state in the Tasks page.
6. Replace `Tasks.tsx` `SequentialTab` inline rendering (lines 1197-1302) with `<SequentialCollectionView familyId={family.id} onCreateCollection={() => setSequentialModalOpen(true)} />`. Standalone-sequential-task rendering path (lines 1292-1300) is removed — standalone sequential tasks without a collection are no longer a valid state once the creation path is fixed.
7. Verify `SequentialCollectionView.tsx` doesn't need internal changes. It already uses `useSequentialCollections(familyId)`, `useSequentialCollection(id)`, `useRedeploySequentialCollection`, and `useFamilyMembers`. All hooks exist and work. The one concern is the `onCreateCollection` callback — the component accepts it as a prop and already renders a [+ Create] button that fires it.

**Sub-phase 1B: Randomizer on Lists page type picker (1 item)**
8. Edit `Lists.tsx:357` — add `'randomizer'` to the hard-coded type array. One-line fix. After fix: `(['shopping', 'wishlist', 'expenses', 'packing', 'todo', 'reference', 'ideas', 'prayer', 'backburner', 'randomizer', 'custom'] as ListType[])`. Randomizer already has a TYPE_CONFIG entry (line 88), RandomizerDetailView already renders it (line 1025-1029), and the createList path already accepts `list_type='randomizer'`.

**Sub-phase 1C: Cross-surface visibility — sequential on Lists page (4 items)**
9. Add `'sequential'` as a TYPE_CONFIG entry in `Lists.tsx` with distinct icon (`Layers` or `BookOpen`). Label: "Sequential Collection". Description: "Ordered items that feed one at a time". Mark as a special meta-type that doesn't map to a real `list_type` enum value.
10. Add `'sequential'` to the type picker grid at `Lists.tsx:357`. When clicked, opens the SequentialCreatorModal instead of the simple list-name input path (requires adding a branch before `handleCreate`).
11. Query sequential collections on the Lists page: import `useSequentialCollections` and call with `family?.id`. Render a new `SequentialCollectionCardOnList` component for each, placed above (or alongside) the regular list cards. Cards show: BookOpen/Layers icon, "Sequential" badge (theme-tokened pill), title, progress indicator (compute from `useSequentialCollection(id)` or use the `current_index` + `total_items` fields on the row without the deeper query for performance). Tapping the card sets a new `selectedSequentialId` state.
12. When `selectedSequentialId` is set, render `<SequentialCollectionView>` in a detail view (mirroring the `selectedListId` pattern at `Lists.tsx:217-224`). Uses the same back button / detail container pattern as `ListDetailView`.

**Sub-phase 1D: Capability tags on Studio seed data (2 items)**
13. Add `capability_tags: string[]` as a **required** field (no `?`) on the `StudioTemplate` type in `src/components/studio/StudioTemplateCard.tsx`. TypeScript compile error on any template that forgets tags.
14. Populate `capability_tags` on every seed template in `studio-seed-data.ts`: all TASK_TEMPLATES_BLANK entries, all TASK_TEMPLATES_EXAMPLES, all GUIDED_FORM_TEMPLATES_BLANK, all GUIDED_FORM_TEMPLATES_EXAMPLES, all LIST_TEMPLATES_BLANK, all LIST_TEMPLATES_EXAMPLES, and RANDOMIZER_TEMPLATE_BLANK. Tag lists taken verbatim from `PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` §1D.

**Verification (3 items, part of the build)**
- `tsc -b` — zero errors. Mandatory before declaring complete (CLAUDE.md convention #121).
- Playwright E2E test file `tests/e2e/features/studio-intelligence-phase1.spec.ts` — create sequential from Studio, Tasks, Lists → each produces one `sequential_collections` row + N `tasks` rows with proper `sequential_collection_id`. Create randomizer from Lists page [+ New List] picker → produces one `lists` row with `list_type='randomizer'`. Verify sequential collection appears on Lists page AND Tasks → Sequential tab after creation.
- `npm run check:colors` — no hardcoded colors introduced. Mandatory per CLAUDE.md convention #15.

#### Stubs (NOT Building This Phase)

All Phase 2 items (search, categories, My Library, recommendations), all Phase 3 items (LiLa creation guide), all Session 2 Linked Steps items (advancement modes, practice_log, linked steps, curriculum-parse, Reading List template, routine duplication). Per-item edit/reassign/delete on SequentialCollectionView remains as-is (existing PRD-09A stub, not regressing).

#### Key Decisions
1. **Zero database changes.** Capability tags live in TypeScript seed data config (Option B from addendum §1D). Tags are a Studio presentation concern, not a runtime data concern.
2. **SequentialCreatorModal is the single source of truth** for sequential creation. Studio, Tasks page, and Lists page all open the same modal. Reuses the existing SequentialCreator component UI without modification.
3. **Dual access, not migration.** Sequential collections remain on Tasks → Sequential tab (with upgraded rendering via the revived SequentialCollectionView) AND are visible on the Lists page. Both paths open the same creation modal and the same management view.
4. **Defensive guards at two layers.** `TaskCreationModal` skips `initialTaskType='sequential'` with a warning; `createTaskFromData` throws on `taskType='sequential'`. Cannot silently create broken rows again.
5. **`capability_tags` is required on the `StudioTemplate` type.** Forgetting tags on a future template is a compile error, not a silent data quality issue. Ensures Session 3 search has complete data.
6. **The standalone-sequential-task rendering path is removed.** Lines 1292-1300 of Tasks.tsx render sequential tasks that have no `sequential_collection_id`. After the fix, such tasks cannot be created via the UI. If any exist in production from the broken period, they remain as orphaned task rows — not touched by this build.
7. **STUB_REGISTRY.md line 368 is currently wrong.** "Sequential reuse/redeploy flow | ✅ Wired | Phase 10 Repair" is incorrect — SequentialCollectionView has zero callers. Will be corrected in the post-build updates.
8. **`is_system` vs `is_system_template`.** Live schema has both columns on `task_templates`. `Studio.tsx:67-72` filters by `is_system = false` — keep using that. No change this build.

---

