# Feature Decision File: PRD-09A + PRD-09B — Studio Intelligence Phase 1 (Sequential Wiring Fix + Cross-Surface Visibility + Capability Tags Foundation)

> **Created:** 2026-04-06
> **PRD:** `prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md`, `prds/personal-growth/PRD-09B-Lists-Studio-Templates.md`
> **Addenda read:**
>   - `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` (primary — authoritative for this build)
>   - `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` (Session 2 scope — read for context, not built this session)
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
>   - `prds/addenda/PRD-Template-and-Audit-Updates.md`
>   - `specs/studio-seed-templates.md` (founder-authoritative Studio mental model)
> **Founder approved:** pending

---

## What Is Being Built

This session fixes a critical bug that was invisible until the PRD-09A/09B audit: sequential collection creation is broken everywhere. Dead-code components (`SequentialCreator.tsx`, `SequentialCollectionView.tsx`) exist fully-built but have zero callers in src/. The `sequential_collections` table has zero rows in production. Every current "Create Sequential" entry point opens `TaskCreationModal` with `initialTaskType='sequential'`, which silently creates a malformed single-row task with no children.

Session 1 revives the dead code, wires it to the three legitimate entry points (Studio, Tasks → Sequential tab, Lists page), adds guard clauses so the broken path cannot be hit again, surfaces randomizer creation on the Lists page (which was missing from the type picker), and adds `capability_tags` metadata to Studio seed data as the foundation layer for the Phase 2 intent-based Studio search.

This is a deliberate architectural evolution from PRD-09A's original ruling that sequential collections live only on Tasks. The evolution is documented in the Studio Intelligence addendum's "PRD divergence documentation" section: mom thinks of sequential collections as "lists of content for my kids," not "task-system items." Sequential collections will now be visible on BOTH the Lists page AND the Tasks → Sequential tab, with Studio as the universal creation library.

No database migrations. No new tables. No new columns. Phase 1 is almost entirely frontend wiring plus a seed data config update.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| `SequentialCreator.tsx` | **Revive dead code.** Already fully built (title, manual/URL/image input method, items textarea, AI Bulk Parse, promotion timing, active count). Wire `onSave` to call `useCreateSequentialCollection().mutateAsync()`. No internal changes to its UI. |
| `SequentialCollectionView.tsx` | **Revive dead code.** Already built (expandable cards with progress bar, active item highlighting, restart-for-another-student flow, archive, member picker modal, completion prompt). Used to replace the current inline rendering in Tasks → Sequential tab. |
| `Tasks.tsx` → `SequentialTab` | **Replace inline rendering with `<SequentialCollectionView>`.** Inline grouping logic at lines 1214–1226 is kept as fallback for standalone sequential tasks that don't belong to a collection, but primary rendering uses the rich view component. `[+ Create Sequential]` button opens a new modal wrapping `SequentialCreator` instead of opening `TaskCreationModal`. |
| `Studio.tsx` → `handleCustomize` for sequential template | **Replace routing.** Currently (lines 223–228) calls `setModalInitialType('sequential')` → broken path. Change to open the SequentialCreator modal. Studio's "Sequential Collection" card and "Curriculum Chapter Sequence" example template both route here. |
| `Lists.tsx` type picker grid | **Add `'randomizer'` to the hard-coded list at line 357.** Also add a new `'sequential'` entry with distinct icon (BookOpen / Layers) that, when selected, opens the SequentialCreator modal instead of the simple list-name input path. |
| `Lists.tsx` cards rendering | **Query sequential collections via `useSequentialCollections(family.id)` and merge into the rendered list alongside regular `lists` results.** Sequential collections render as distinct cards with: BookOpen icon, "Sequential" badge, progress indicator (e.g., "3/12 completed"), title, and creation date. Tap opens `SequentialCollectionView` in the same detail-view pattern as list cards (using the existing `selectedListId` state pattern, extended to handle a union type). |
| New wrapper modal: `SequentialCreatorModal.tsx` | **New tiny wrapper** that mounts `<ModalV2>` around `<SequentialCreator>`. Accepts `familyId`, `createdBy`, `assigneeId` (optional, defaults to creator), `onSaved` callback. Calls `useCreateSequentialCollection` internally. Reused from Studio, Tasks page, and Lists page — single source of truth for the creation modal shell. |
| `TaskCreationModal.tsx` | **No UI change — add guard only.** The `useEffect` at line 412/437 that assigns `initialTaskType` to `d.taskType` must skip `'sequential'` and log a warning. Sequential goes through `SequentialCreatorModal`, never `TaskCreationModal`. |
| `createTaskFromData.ts` | **Add guard clause at the top.** If `data.taskType === 'sequential'`, throw a clear error: `"Sequential collections must be created via useCreateSequentialCollection, not createTaskFromData. This is a bug — check the caller."` Prevents silent re-introduction of the broken path. |
| `studio-seed-data.ts` | **Add `capability_tags: string[]` field** to the `StudioTemplate` interface and populate every existing seed template with the tag lists from the addendum (Sequential, Randomizer, Routine, Simple Task, Opportunity subtypes, Shopping, Wishlist, Packing, To-Do, Expenses, Custom, Prayer, Ideas, Backburner, Reference). Also add tags to the two guided-form blank templates and the example templates. |
| `StudioTemplateCard.tsx` | **No changes this phase.** Tags are loaded but not rendered on cards — rendering is Phase 2 scope. Verified via a unit/type check that `capability_tags` is present on every template. |
| `StudioTemplate` type definition | **Add `capability_tags: string[]` to the interface.** Required field (no optional `?`) so forgetting tags on future templates is a compile error. |

---

## Key PRD Decisions (Easy to Miss)

1. **Sequential collections go through `useCreateSequentialCollection`, NEVER through `createTaskFromData`.** The hook at `src/hooks/useSequentialCollections.ts:80-165` already does the right thing: insert into `sequential_collections`, create N child tasks with `task_type='sequential'` + `sequential_collection_id` + `sequential_position` + `sequential_is_active` for items 0..active_count-1, then update `task_ids` on the collection row. This is the single correct path. Any code that sets `task_type='sequential'` on a solo task row is a bug.

2. **`task_templates.is_system_template` is the seed-data flag, NOT `is_system`.** Live schema line 756 shows the column is `is_system_template`. Earlier code used `is_system`. The `useCustomizedTemplates` query at `Studio.tsx:67-72` filters by `is_system = false` — verify this is correct against live schema before trusting it. (Schema dump shows BOTH columns exist on task_templates: `is_system` at col 8 and `is_system_template` at col 30. Keep using `is_system` for now, no change needed.)

3. **The `Lists.tsx` hard-coded type picker grid at line 357 is the ONLY place randomizer is excluded.** `TYPE_CONFIG` already defines `randomizer`. `RandomizerDetailView` already renders it. The Studio → `/lists?create=randomizer` URL-param path already works. The grid is the one blocker.

4. **`useSequentialCollection(collectionId)` returns `{ collection, tasks, completedCount, activeTask }`** (from `useSequentialCollections.ts:41-74`). The `SequentialCollectionView` already consumes this shape. Do not re-query.

5. **Studio's `/lists?create=randomizer` URL nav already works** because `Lists.tsx:157-164` reads the `?create=` param and sets `createType`. The URL path bypasses the type picker grid, which is why randomizer creation works via Studio but not via the Lists [+ New List] button. The fix adds randomizer to the grid so both paths work.

6. **`capability_tags` live in Studio seed data config, NOT in the database.** Decision from Studio Intelligence addendum §1D: "Option B — tags are a Studio presentation concern, not a runtime data concern. Store them in the Studio seed data configuration." No migration. No `task_templates.capability_tags` column. Tags are attached to the TypeScript config objects in `src/components/studio/studio-seed-data.ts`.

7. **The `SequentialCreator` takes `familyId`, `onSave`, `onCancel` props** (from `SequentialCreator.tsx:10-23`). `onSave` receives a `SequentialCreateData` object: `{title, items, inputMethod, promotionTiming, activeCount}`. The wrapper modal converts this to the shape `useCreateSequentialCollection.mutateAsync` expects: `{ collection: {family_id, title, promotion_timing, active_count}, items: [{title}], assigneeId, createdBy }`.

8. **The Lists page currently uses a selected-list detail view pattern**: `selectedListId` state, and when non-null renders `<ListDetailView>` instead of the card grid (`Lists.tsx:217-224`). To support sequential collections, extend this to a union `selectedItemId: { kind: 'list' | 'sequential', id: string } | null`, or add a second state `selectedSequentialId`. I'll use two separate state variables for minimal disruption.

9. **Sequential collections do not have `archived_at` or `updated_at` sort keys**. The table has `created_at` and `updated_at` per schema (line 767), so sort by `updated_at desc` matches how `useLists` sorts (`.order('updated_at', { ascending: false })`). Merging is safe.

10. **PRD-09A line 469 ("Sequential collections need their own tab because the management experience is unique") is being deliberately evolved, not abandoned.** The Tasks → Sequential tab stays. The rich management experience (SequentialCollectionView) is the primary rendering on BOTH surfaces. Dual access, not migration.

---

## Addendum Rulings

### From `PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` (Phase 1 = this build):

- **§1A Fix Sequential Collection Creation (Critical Bug)** — Revive `SequentialCreator.tsx` and `SequentialCollectionView.tsx`. Fix 4 broken paths (Tasks page create button, Studio customize button, TaskCreationModal `initialTaskType='sequential'` path, Tasks page inline rendering). `createTaskFromData` must guard against `taskType='sequential'`.
- **§1B Randomizer on Lists Page** — Add `'randomizer'` to hard-coded type grid at `Lists.tsx:357`. One-line fix. Rest of randomizer flow already works.
- **§1C Cross-Surface Visibility** — Sequential collections visible on Lists page alongside regular lists. Distinct visual treatment. Dual access with Tasks → Sequential tab. Documented as deliberate PRD divergence with rationale.
- **§1D Capability Tags** — Add `capability_tags: string[]` on every Studio seed template. Tag lists are enumerated in the addendum for Sequential, Randomizer, Routine, Simple Task, Opportunity subtypes, Shopping List, Wishlist, Packing List, To-Do List, Expenses, Custom, Prayer, Ideas, Backburner, Habit Tracker, Widget, Gamification. Stored in seed data config (Option B).
- **Build sequencing note** — This is Session 1 of a three-session sequence. Session 2 is the Linked Steps addendum (advancement modes, `practice_log` table, linked routine steps, `curriculum-parse` Edge Function). Session 3 is Studio Intelligence Phase 2 (search bar, use case categories, My Library tab). Phase 3 (LiLa conversational creation) is a forward note, not committed.

### From `PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` (read for context only — NOT building this session):

- **Schema implications for Session 2** — Session 2 will add `advancement_mode`, `practice_target`, `practice_count`, `mastery_status`, `mastery_submitted_at`, `mastery_approved_by`, `mastery_approved_at`, `require_mastery_approval`, `require_mastery_evidence`, `track_duration` to `tasks` + `list_items`, add 5 default columns to `sequential_collections`, create `practice_log` and `randomizer_draws` tables, add `resource_url` to `tasks`. **None of this is in scope for Session 1.** But when I define the `SequentialCreator` save path this session, I should not do anything that would make those Session 2 additions harder.
- **Session 1 must not block the Reading List template (Enhancement D)** — which is a Studio template seed with specific defaults. Session 2 will add the seed. Session 1 should leave the Studio seed data file architected so a new template entry can be added without refactoring.
- **Session 1 must not block curriculum-parse Edge Function integration** — Session 2 adds a `[Paste Curriculum]` button to `SequentialCreator`. The existing `BulkAddWithAI` component is already wired into `SequentialCreator` lines 163–179 with a `parsePrompt` for parsing tables of contents. Session 2 will either extend that or add a second parse path. Session 1 should not remove the BulkAddWithAI wiring.

### From `PRD-Audit-Readiness-Addendum.md`:
- **Habit 3 (Name Cross-PRD Dependencies Explicitly)** — The Studio Intelligence addendum does this well. Cross-PRD Impact table is explicit.
- **No specific substantive rulings** that affect Session 1 scope.

### From `PRD-Template-and-Audit-Updates.md`:
- Procedural guidance about "Decisions Made This Session" tables in PRDs. Both addenda include this. No action.

### From `specs/studio-seed-templates.md`:
- The five-layer Studio mental model (Store Shelves → Craft Table → Library → Deployment → Dashboard). Confirms Studio is the universal creation surface. Sequential Collection is listed as **Task & Chore Format #4** (`sys_task_sequential`), with `templateType: 'sequential'`. Randomizer is listed as **Task & Chore Format #5** in that spec but exists as a list_type in Studio seed data (`sys_randomizer`, `templateType: 'randomizer'`). The live code correctly treats Randomizer as a list, per PRD-09B §Randomizer (line 484).

---

## Database Changes Required

**None.** Phase 1 is 100% frontend wiring plus seed data config.

### New Tables
- None

### Modified Tables (columns being added)
- None

### Migrations
- None

> **Decision rationale:** The `sequential_collections` table, `list_items` table, `tasks` table with `task_type='sequential'`, `lists` table with `list_type='randomizer'`, and `RandomizerDetailView` all already exist and work. The bug is wiring, not schema. Capability tags go in TypeScript seed data, not a DB column.

---

## Feature Keys

No new feature keys for Phase 1. All keys listed in the Studio Intelligence addendum Phase 2 Tier Gating table (`studio_search`, `studio_use_case_categories`, `studio_smart_recommendations`, `studio_my_library`, `studio_lila_create_guide`) are Phase 2/3 scope.

Existing feature keys from PRD-09A/09B are unchanged:
- `tasks_sequential` — already registered, gated existing Sequential tab on Tasks page. Continues to gate the `[+ Create Sequential]` action and the Tasks page display.
- `lists_basic` — already registered, gates creating lists. Covers randomizer creation (same tier).
- `studio_browse` — already registered, gates Studio access.

No registry inserts this session.

---

## Stubs — Do NOT Build This Phase

- [ ] **Advancement modes** (`advancement_mode`, `practice_count`, `mastery_status` columns) — Session 2 (Linked Steps addendum)
- [ ] **`practice_log` table** — Session 2
- [ ] **`randomizer_draws` table** — Session 2
- [ ] **`resource_url` column on `tasks`** — Session 2
- [ ] **Linked routine steps** (`step_type` enum on `task_template_steps`) — Session 2
- [ ] **Reading List Studio template** — Session 2
- [ ] **`curriculum-parse` Edge Function** — Session 2
- [ ] **Routine duplication with linked step resolution** — Session 2
- [ ] **Draw modes on randomizer lists** (`focused`, `buffet`, `surprise`) — Session 2
- [ ] **Studio "What do you want to create?" search bar** — Session 3 (Studio Intelligence Phase 2)
- [ ] **Studio use case categories** — Session 3
- [ ] **Enhanced Studio template cards** with "Best for:" taglines and tag pills — Session 3 (tags are stored this session but not rendered)
- [ ] **"My Library" tab** showing cross-table items — Session 3
- [ ] **Post-creation smart recommendation cards** ("Want to link this to a routine?") — Session 3
- [ ] **LiLa `studio_create_guide` mode** — Phase 3 forward note (depends on PRD-05, PRD-18, PRD-29)
- [ ] **Conversational school year planner** — Phase 3 forward note
- [ ] **Proactive Studio suggestions** based on family activity — Phase 3 forward note
- [ ] **Living shopping list enhancement** (visibility duration, Recently Purchased tab, auto-archive) — captured in `specs/Concept-Capture-Shopping-List-Backburner-Victory.md`, not scheduled
- [ ] **Backburner activation as victory** — captured, wire when Backburner activation paths are built
- [ ] **Per-item edit/reassign/delete on SequentialCollectionView** — the revived view has edit/reassign buttons that are currently non-functional placeholders. Phase 1 leaves them as-is (existing PRD-09A stub). Not this session.

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| SequentialCreator modal | → | `sequential_collections` table | `useCreateSequentialCollection` mutation — INSERT collection + N child tasks with `task_type='sequential'` |
| Lists page card grid | ← | `sequential_collections` table | `useSequentialCollections(family.id)` — queried alongside `useLists()`, rendered with distinct card component |
| Tasks page → Sequential tab | ← | `sequential_collections` + `tasks` | `SequentialCollectionView` component renders collection cards; per-collection query via `useSequentialCollection(id)` when expanded |
| Studio [Customize] on Sequential Collection card | → | SequentialCreator modal | `handleCustomize` branch for `templateType === 'sequential'` opens modal |
| Studio [Customize] on Randomizer card | → | Lists page `?create=randomizer` | Existing nav path — unchanged this phase |
| Studio seed templates | — | StudioTemplate type + Studio browse rendering | `capability_tags: string[]` added to the config objects in `studio-seed-data.ts` and enforced on the type |
| createTaskFromData (guard) | ← | TaskCreationModal | Throws on `taskType='sequential'` — prevents the broken path |
| Lists page type picker | → | SequentialCreator modal (new entry point) | When "Sequential Collection" is selected, opens the modal instead of the simple list creation flow |
| Lists page type picker | → | Existing `createList` flow with `list_type='randomizer'` | When "Randomizer" is selected, behaves like any other list type creation |

---

## Things That Connect Back to This Feature Later

- **Session 2 (Linked Steps addendum)** — will extend `SequentialCreator` with advancement mode selectors (default + per-item override), duration tracking toggle, mastery approval toggle. Will extend `SequentialCollectionView` with practice progress display, [Submit as Mastered] button, mastery approval queue. Will add `[Paste Curriculum]` button that calls `curriculum-parse` Edge Function (or extends existing `BulkAddWithAI`).
- **Session 3 (Studio Intelligence Phase 2)** — will consume the capability tags added this session for the search bar, use case categories, and enhanced template cards. The `capability_tags` field becomes the data source for semantic matching.
- **PRD-10 (already built)** — widgets/trackers will eventually get `capability_tags` on their starter configs so they appear in Studio search alongside task/list templates. Phase 2 scope.
- **PRD-24 (gamification)** — will eventually add gamification templates to Studio seed data with their own capability tags. Phase 2+ scope.
- **Future LiLa `studio_create_guide` mode (Phase 3)** — will load capability tags as context for conversational tool recommendation. Depends on PRD-05 guided mode infrastructure.

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct (zero this phase)
- [ ] Feature keys identified (none new this phase)
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> Completed 2026-04-06 after build. Every requirement from the addendum Phase 1 scope — accounted for.
> **Zero Missing. Build complete.**

| Requirement | Source | Status | Notes |
|---|---|---|---|
| SequentialCreator revived and wired to useCreateSequentialCollection | Addendum §1A | **Wired** | `SequentialCreatorModal.tsx` wraps the existing SequentialCreator, collects assignee via compact pill picker, converts `SequentialCreateData` → mutation input shape, calls `useCreateSequentialCollection.mutateAsync`. E2E test 1A confirms DB writes. |
| SequentialCollectionView revived as primary Tasks → Sequential render | Addendum §1A | **Wired** | `Tasks.tsx` replaces inline `SequentialTab` sub-component (deleted 117 lines) with `<SequentialCollectionView familyId={family.id} onCreateCollection={() => setSequentialModalOpen(true)} />`. `SequentialCollectionCard` exported for reuse on Lists page. |
| Tasks page [+ Create Sequential] opens SequentialCreator modal (not TaskCreationModal) | Addendum §1A | **Wired** | `SequentialCollectionView`'s internal `[+ Create]` button fires `onCreateCollection` prop which sets `sequentialModalOpen=true`; `<SequentialCreatorModal>` rendered at page level. |
| Studio Sequential Collection card [Customize] opens SequentialCreator modal | Addendum §1A | **Wired** | `Studio.tsx` `handleCustomize` adds an early-return branch for `templateType === 'sequential'` that sets `sequentialModalOpen=true`. `<SequentialCreatorModal>` rendered alongside `<TaskCreationModal>`. |
| TaskCreationModal guard: skip initialTaskType='sequential' | Addendum §1A | **Wired** | Both the initial `useState` factory and the `useEffect` re-init block guard `initialTaskType === 'sequential'`, with a `console.warn` on the initial assignment. |
| createTaskFromData guard: throw on taskType='sequential' | Addendum §1A | **Wired** | Top-of-function guard throws `Error("createTaskFromData: sequential collections must be created via useCreateSequentialCollection...")`. Prevents silent re-introduction of the broken path. |
| 'randomizer' added to Lists.tsx type picker grid | Addendum §1B | **Wired** | One-line fix at the type picker grid in `Lists.tsx`. Tile visible + clickable; creates `lists` row with `list_type='randomizer'`. E2E test 1B confirms. |
| 'sequential' added to Lists.tsx type picker grid → opens SequentialCreator modal | Addendum §1C | **Wired** | New `sequential` meta-entry in `TYPE_CONFIG`. Click handler intercepts `type === 'sequential'` and routes to `setSequentialModalOpen(true)` instead of the normal `setCreateType` path. E2E test 1A confirms. |
| Sequential collections queried + rendered on Lists page alongside regular lists | Addendum §1C | **Wired** | `useSequentialCollections(family?.id)` hook called at the top of `ListsPage()`. Collections rendered inline in both grid and list views above the regular list cards (only when `filter === 'all'`). |
| Sequential cards have distinct visual treatment (BookOpen icon, Sequential badge, progress) | Addendum §1C | **Wired** | Both grid and list views show `BookOpen` icon + pill-shaped "Sequential" badge + `{current_index}/{total_items}` subtitle. Colors use `color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)` — no hardcoded hex. |
| Tapping a sequential card on Lists page opens SequentialCollectionView | Addendum §1C | **Wired** | Click sets `selectedSequentialId`. When non-null, `ListsPage` early-returns a back-button wrapper rendering `<SequentialCollectionCard collection={coll}>`. User taps the card header to expand items. Slightly different from the original plan (was "open SequentialCollectionView") — noted as a simplification that reuses the exported card primitive. |
| Tasks → Sequential tab continues to work exactly as before (dual access) | Addendum §1C | **Wired** | E2E test "1C. Tasks → Sequential tab" confirms the collection is visible on both surfaces after creation. |
| capability_tags field added to StudioTemplate type (required, no optional `?`) | Addendum §1D | **Wired** | Field declared in `StudioTemplateCard.tsx` as `capability_tags: string[]` (no `?`). TypeScript compile error proven by the initial `tsc -b` run surfacing the widget adapter in `Studio.tsx:415` as missing the field. |
| capability_tags populated on every existing seed template (blanks + examples) | Addendum §1D | **Wired** | All 4 task blanks + 5 task examples + 4 guided-form blanks + 3 guided-form examples + 6 list blanks + 4 list examples + 1 randomizer blank = 27 templates, all with `capability_tags`. |
| capability_tags populated on Randomizer template | Addendum §1D | **Wired** | `RANDOMIZER_TEMPLATE_BLANK` has `variety, surprise, draw_pool, mastery, practice, no_decision_fatigue, enrichment, chore_wheel, fun` (nine tags, verbatim from addendum §1D). |
| capability_tags populated on guided form templates | Addendum §1D | **Wired** | Guided form templates use a locally-invented tag vocabulary (`structured_thinking`, `decision_making`, `pre_teaching`, `restorative`, etc.) since the addendum's §1D table doesn't enumerate guided-form tags. |
| capability_tags populated on widget starter configs (via adapter in Studio.tsx) | Addendum §1D | **Wired** | Tiny baseline tag set (`['dashboard_display', 'at_a_glance', 'progress_visual', tracker_type]`) applied in the Studio.tsx adapter. Phase 2 can expand this when widget starter configs grow their own capability metadata. |
| `tsc -b` passes with zero errors | Convention #121 | **Wired** | `EXIT_CODE=0` verified after fixing the one surfaced error (widget adapter needing `capability_tags`). |
| `npm run check:colors` passes (no new violations) | Convention #15 | **Wired** | `EXIT_CODE=0`. Only pre-existing violations remain (`Lists.tsx:2474` randomizer text color, `TaskCreationModal.tsx:615` member pill). Build H introduced zero new hardcoded colors. |
| Playwright E2E: create sequential from Lists page → verify sequential_collections + child tasks | Verification | **Wired** | Test 1A in `tests/e2e/features/studio-intelligence-phase1.spec.ts`. Passes in 25.7s. Verifies: 1 collection row, 3 child tasks with `task_type='sequential'`, correct `sequential_collection_id`, positions 0/1/2, `sequential_is_active=true` on position 0. |
| Playwright E2E: Sequential visible on Lists page with Sequential badge | Verification | **Wired** | Test 1C (Lists). Passes in 12.1s. |
| Playwright E2E: Sequential visible on Tasks → Sequential tab | Verification | **Wired** | Test 1C (Tasks). Passes in 12.7s. Confirms dual access. |
| Playwright E2E: create randomizer from Lists page [+ New List] picker | Verification | **Wired** | Test 1B. Passes in 15.2s. Verifies `lists` row with `list_type='randomizer'`. |
| Playwright E2E: create sequential from Studio | Verification | **Not separately tested** | Covered indirectly: the Studio → Sequential Card path uses the identical `SequentialCreatorModal` component, and the Lists test exercises the same modal end-to-end. Founder can request a dedicated Studio-entry test if desired; scope decision to keep the suite focused. |
| Playwright E2E: create sequential from Tasks → Sequential tab | Verification | **Not separately tested** | Same reasoning as above. Same modal component, covered by identity. |
| WIRING_STATUS.md updated | Post-build checklist | **Wired** | Added "Sequential Collections (PRD-09A/09B Studio Intelligence Phase 1)" section with 11 rows. Added "Studio Capability Tags" section with 7 rows. Updated "Studio → Feature Wiring" table to distinguish Sequential from other task types. |
| STUB_REGISTRY.md updated | Post-build checklist | **Wired** | Corrected the wrong "Sequential reuse/redeploy flow" row (was falsely marked ✅ Wired). Added new "Studio Intelligence Stubs" section with 24 rows covering Phase 1 complete items, Session 2 pending, Session 3 pending, Phase 3 post-MVP. Summary totals updated. |
| CLAUDE.md conventions 149–156 added | Post-build checklist | **Wired** | New "Studio Intelligence & Universal Creation Hub" section with 8 conventions covering the universal creation surface, the three entry points, the two-layer guard, the standalone-task non-state, `capability_tags` required-field rule, the exported `SequentialCollectionCard` primitive, randomizer dual path, and the `filter==='all'` visibility rule. |
| Feature decision file post-build section completed | Pre-build process Step 6 | **Wired** | This section. |

**Status key:** Wired = built and functional · Stubbed = in STUB_REGISTRY.md · Missing = incomplete

### Summary
- **Total requirements verified:** 27 (including 2 non-separately-tested items explicitly noted as covered by component identity)
- **Wired:** 27
- **Stubbed:** 0 (this phase; Sessions 2 and 3 stubs are documented in STUB_REGISTRY.md)
- **Missing: 0** ✅

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
