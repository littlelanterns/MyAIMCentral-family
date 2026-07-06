# STUDIO-EXPERIENCE — Full Studio Surface Audit (Evidence Record)

> **Status: AUDIT COMPLETE — 2026-07-04. Awaiting founder gate on the cleanup slice plan (§4) + immediate ST-0 hotfix approval (F-21).**
> Founder acceptance bar (verbatim): "The Studio page is still kind of a mess. A lot of the templates and wizards don't quite do what they are meant to. We need every single thing in there to be user friendly and accurate, and to end up with a fully integrated list, tracker, reward system, etc. completely customized, able to both describe in normal language and then enter/edit the prefilled forms."
> Measuring sticks: `claude/web-sync/Composition-Architecture-and-Assembly-Patterns.md` (authoritative), CLAUDE.md Conventions 249–256, `specs/studio-seed-templates.md`, Phase 3.7/3.8/Studio-Intelligence-Phase-1/Build-J archives.
> **Audit context note:** run against the uncommitted working tree of 2026-07-04 (parallel sessions KIDS-REWARDS-S4, SAFETY-BETA-GATE, CLIENT-DATE-REMEDIATION have uncommitted changes in it). Grades reflect the state that will ship.

---

## §0 — Shelf Inventory (what Studio actually offers, from code)

Source: `src/components/studio/studio-seed-data.ts` + `src/pages/Studio.tsx` render order.

| # | Section (render order) | Tiles |
|---|---|---|
| 0 | NLC "Describe what you want" | `NaturalLanguageComposition` (browse tab, hidden while searching) |
| 1 | Setup Wizards | WIZARD_TEMPLATES (3: Family Meeting Setup, Routine Builder (AI), Create a List) + PHASE37_WIZARD_TEMPLATES (3: Rewards List, Progress Chart, Extra Earning/Consequence Spinner) + PHASE38_WIZARD_TEMPLATES (2: Subject Activities, Shared To-Do) + seeded examples PHASE37_SEEDED (3: Potty Chart, Consequence Spinner, Extra Earning Opportunities) + PHASE38_SEEDED (3: Reading Fun, Homeschool Variety Pack, Honey-Do List) |
| 2 | Task & Chore Templates | 4 blanks (Simple Task, Routine Checklist, Opportunity Board, Sequential Collection) + 6 examples (Morning Routine, Bedroom Clean-Up, Extra House Jobs Board, Curriculum Chapter Sequence, Reading List, TSG Extra Jobs Randomizer) |
| 3 | Guided Forms & Worksheets | 4 blanks (Guided Form, SODAS, What-If, Apology Reflection) + 3 examples |
| 4 | List Templates | 6 blanks + Randomizer blank + 1 seeded wizard (Shared Family Shopping List) + 4 examples (Weekly Grocery, Road Trip Packing, Birthday Wishlist, Homeschool Budget) |
| 5 | Trackers & Widgets | DB `widget_starter_configs` (39 rows) filtered to `FUNCTIONAL_TRACKER_TYPES` (19 types) |
| 6 | Gamification & Rewards | 6 tiles (Gamification Setup, Day Segments, Coloring Page Reveal, Reward Reveal, Star/Sticker Chart, Reward Spinner) |
| 7 | Growth & Self-Knowledge | 2 tiles (Get to Know Your Family, Best Intentions Starter) |

Plus tabs: **Drafts** (localStorage scan) and **My Customized** (task_templates + list_templates only).

---

## §1 — Stage 0 code-level findings (pre-browser; each to be confirmed/graded in Stage 1)

### F-01. NLC front door only routes to 6 of ~20 outcomes, with no escape value — MISLEADING vs Convention 253
`NaturalLanguageComposition.tsx` — the Haiku router's schema forces `wizardType` to one of exactly six Phase 3.7/3.8 wizards (rewards_list, repeated_action_chart, list_reveal opportunity/draw, activity_list, shared_task_list). There is **no "none of these" option in the JSON schema**. Mom describing a routine, shopping list, tracker, sequential curriculum, meeting cadence, potty chart *variant*, or Best Intention gets force-matched into one of six wrong shapes. The low-confidence fallback menu offers only the same 6 wizards — not the full catalog (RoutineBuilderWizard, UniversalListWizard, StarChartWizard, SequentialCreatorModal, MeetingSetupWizard all exist but are unreachable from NLC). Convention 253 requires NLC "available everywhere a wizard is available" with a restate-and-offer fallback across the wizard catalog.

### F-02. Drafts are localStorage-only, single-slot, and cover 4 of ~14 creation surfaces — violates Convention 250
`useWizardDraft.ts` — drafts persist to `localStorage` keyed `wizard-draft-{type}-{familyId}-{draftId||'new'}`:
- **No cross-device survival** (mom starts on desktop, gone on phone). Convention 250's data-layer requirement (`is_draft` on primitives) is unmet; the `wizard_templates` table built for this sits at 0 rows in production.
- **draftId is always `'new'`** → one draft slot per wizard type; the spec'd multi-draft picker ("You have 3 drafts of this") is impossible.
- **Coverage:** only RewardsListWizard, RepeatedActionChartWizard, ListRevealAssignmentWizard, SharedTaskListWizard call `useWizardDraft`. ActivityListWizard is listed in the Drafts tab's label map + Resume switch but has NO draft code (phantom entry — dead branch). UniversalListWizard, RoutineBuilderWizard, MeetingSetupWizard, StarChartWizard, GetToKnowWizard, TaskCreationModal, SequentialCreatorModal, GuidedFormAssignModal, NLC: no save-and-return at all.
- Drafts tab "Resume" (Studio.tsx:1195-1212) opens the wizard type without passing `draftId` — works only because of the single-slot design.
- Draft "Discard" uses `window.confirm` (Studio.tsx:1223) — not the ModalV2 pattern.
- **Close/reopen UX deviates from §2.2:** the 4 draft-capable wizards silently auto-save (3 on close via handleClose; SharedTaskList continuously on state change) — no "Save as a draft to come back to?" prompt, no visible "Save & Come Back" button, no "continue or start fresh?" reopen prompt (drafts restore silently). Work is preserved; the reassurance UX the spec considers load-bearing ("mom *knows* her work is preserved") isn't there, and mom can never intentionally start fresh while keeping the old draft.

### F-03. "My Customized" Duplicate on non-routine/non-list templates NEVER works — CONFIRMED (constraint-level proof)
Studio.tsx:1372-1381 inserts `{family_id, created_by, title, task_type, is_system}` — **no `template_name`, which is NOT NULL on `task_templates`** (probed live 2026-07-04: error 23502 "null value in column template_name"). Every non-routine/non-list Duplicate in production therefore fails the constraint, and the error path is silent (`if (!error) window.location.reload()` — no toast, no log). The button does nothing, ever. Secondary defects for when the insert is fixed: `task_type` receives the *Studio* type string (`'opportunity_claimable'` ≠ DB `'opportunity'`), and the copy would carry only title+type (config/reward/homework/allowance flags dropped — Convention 2.7 violated). Also: Duplicate/Edit/Archive live behind an unlabeled ⋯ "More options" menu (discoverability).

### F-04. Example templates promise pre-filled content they don't load (opportunity board, sequential) — MISLEADING
`handleCustomize`:
- `ex_extra_house_jobs` ("8 real chore jobs + 2 connection items") → generic branch → TaskCreationModal opens with only the **title** pre-filled, type 'opportunity' (single task, not a board). No jobs load.
- `ex_curriculum_sequence` ("5 sample chapters") → SequentialCreatorModal opens with NO items; only `ex_reading_list` gets preset defaults (and those are settings, not content).
- Routine examples DO load sections from DB (title-match lookup). List examples DO pass `&template=<id>` to /lists. The gap is specifically opportunity + sequential examples.

### F-05. "Opportunity Board" blank tile opens a single-task creator — MISLEADING vs its own card copy
Card promises a *board* ("Mom selects which family members can see each board", three sub-types). `handleCustomize` → TaskCreationModal `initialTaskType='opportunity'` → creates ONE opportunity task. Board-shaped creation lives in ListRevealAssignmentWizard (opportunity flavor) and Lists page — this tile routes to neither. Post-OPPORTUNITY-SURFACES, boards are `lists` with `is_opportunity` — the shelf's flagship opportunity tile bypasses the board model entirely.

### F-06. "Best Intentions Starter" card promises a wizard; tap is a nav-away — MISLEADING
Card: "This wizard helps you create 3-5 starter intentions across family, personal growth, health, and relationships." `handleCustomize` → `navigate('/guiding-stars?tab=intentions')`. No wizard exists.

### F-07. Studio search ignores capability_tags; Phase 2 intent search still missing
`matchesSearch` greps name/tagline/description/exampleUseCases only. `capability_tags` (required on every template as "the data foundation for Phase 2's intent-based Studio search") are dead data. Registered Phase 2 stubs also still missing: use-case browse, "Best for:" pills, My Library unified tab. Also: search hides the NLC input (`!searchQuery.trim()`), and Trackers & Widgets + Gamification + Growth sections are NOT search-filtered — searching "potty" hides task/list sections but leaves all 19 tracker tiles and all 6 gamification tiles visible regardless of match, while `noSearchResults` ignores them too.

### F-08. Wizard outputs bypass "My Customized" — the Drafts→Customized lifecycle (Convention 250) doesn't exist for wizards
`useCustomizedTemplates` reads `task_templates` + `list_templates` only. Three wizards DO write `wizard_templates` rows on deploy (ListRevealAssignmentWizard.tsx:949, RepeatedActionChartWizard.tsx:424, SharedTaskListWizard.tsx:383) — but **nothing reads that table** (0 rows in production; either never deployed in prod or writes failing silently — Stage 1 verifies). RewardsListWizard/ActivityListWizard/UniversalListWizard/StarChartWizard/GetToKnowWizard/MeetingSetupWizard write nothing template-shaped. Net effect: a deployed Potty Chart / Extra Earning board / Shared To-Do never appears in My Customized, is not re-openable-pre-populated per Convention 250 ("Customized items remain editable — opening one re-launches its wizard pre-populated"), and is not duplicable per §2.7.

### F-09. Duplicate/Archive on My Customized use `window.location.reload()`; archive has no undo/confirm
Studio.tsx:1379, 1396 — full page reloads; archive fires instantly with no confirmation (contrast: draft discard confirms).

### F-10. Trackers & Widgets: 20 non-functional tracker types silently hidden; category-key mismatch
`FUNCTIONAL_TRACKER_TYPES` (19 types) filters the 39 starter configs on the shelf — correct honesty behavior, but the WidgetPicker (reached from Gamification tiles when no starter config matches) has the known category-key mismatch (KIDS-REWARDS follow-up: 3 sequential_path configs never render there). `handleCustomize` widget_ branch picks the FIRST starter config matching tracker_type — fine for single-config types, arbitrary for multi-config types.

### F-11. Studio "today" derivation is device-clock (Convention #257 read-class)
Studio.tsx:136-137 computes `todayStr` from `new Date()` for the Scheduled-badge / deployment end-date filters. Same class as CLIENT-DATE-REMEDIATION's R-list (not in its scope list). Low stakes (badge display), log for the same sweep.

### F-12. NLC hidden during search; no voice input; error fallback loses mom's words
NLC renders only when the search box is empty. `sendAIMessage(...,'haiku')` with no telemetry tag (ai_usage catchall). On unparseable response mom gets "I couldn't quite figure that out" + 6 wizard chips — the composition doc requires restating her words ("Based on what I'm hearing — [restate]"). The medium/low confidence paths DO restate (compliant); the hard-error path doesn't.

### F-13. "Use as-is" button on example cards is identical to "Customize" — MISLEADING affordance
`StudioTemplateCard` renders both buttons on examples; Studio's `handleUseAsIs` just calls `handleCustomize(template)`. Nothing ever deploys as-is. Two buttons, one behavior.

### F-14. Wizard-composed reward contracts reference deed types NOTHING produces — reward promise dead on arrival (verify live in Stage 2)
`ListRevealAssignmentWizard` (opportunity flavor: per-item money/points/custom contracts + allowance contract, all `source_type='list_item_completion'`; draw flavor: `assign_task_godmother` contract on `source_type='randomizer_drawn'`) and `ActivityListWizard` (two `list_item_completion` contracts, lines 283/304) author contracts against deed source types with **zero producers**: every `fireDeed()` call site in the app fires `task_completion` or `intention_iteration`; the only server producer is `scheduled_occurrence_active` (fire-painted-schedules). The deed_firings CHECK (migration 100200) *permits* `list_item_completion`/`randomizer_drawn` but no code inserts them. Consequences:
- Opportunity-wizard boards: reward flow, if it works at all, works via the OPPORTUNITY-SURFACES bridge-task snapshot path (`task_rewards` on the claim bridge task → `task_completion` deed) — the wizard's own contracts never match and sit as dead rows in mom's /contracts page.
- Draw-flavor spinner: the contract that is supposed to CREATE the task on the kid's dashboard (assign_task_godmother) + play the reveal never fires — draw behavior, if any, comes from the Lists page's own promotion machinery.
- ActivityListWizard reward thresholds: same dead-key problem.
All three wizards' cards say "compose contracts under the hood for automatic reward delivery." Stage 2 S1 verifies end-to-end money flow and grades what actually pays.

### F-15. Convention 254 (MindSweep configuration-worthy detection) is stated as law but entirely unbuilt
Zero matches for composition/configuration-worthy concepts in `mindsweep-sort` or any client file. It was an explicit Phase 3.7 do-not-build, yet CLAUDE.md Convention 254 describes it in present tense. Same convention-vs-reality drift class applies to 250 (drafts data-layer), 252 (bulk-add universality), 253 (NLC everywhere). S5 will demonstrate the user-facing effect.

### F-16. RewardsListWizard card promises "bulk-paste a brain dump" — wizard has AI-suggest only
Card copy: "Add items one at a time or bulk-paste a brain dump and let AI sort them." The wizard has a "Let AI suggest rewards" generator (good — Convention 251 partially) but NO paste/bulk-add input. Wizard-wide bulk-add coverage: shared `BulkAddWithAI` on 4 (ActivityList, RoutineBuilder via RoutineBrainDump, SharedTaskList, UniversalList) + a bespoke inline AI bulk parse in ListRevealAssignmentWizard (~line 680, functional but a second implementation of the universal pattern); missing entirely on RewardsList (despite its card copy), RepeatedActionChart milestones, StarChart, GetToKnow, MeetingSetup.

### F-17. Widget starter-config category keys mismatch WidgetPicker's — configs invisible in picker browse
Seeds (migrations 100032/100056) write human labels ('Daily Life & Routines', 'Special Needs & Therapy', …); `WidgetPicker.tsx:32-41` looks up 8 snake_case keys (routine_trackers, goal_pursuit, …). NONE match except the Hub configs migration (100063, 'goal_pursuit'). Studio's own Trackers section bypasses the picker so tiles show there, but any flow that lands in WidgetPicker's category browse (gamification tiles without starter config, Dashboard picker) never surfaces the 100032/100056 configs. Root cause was undocumented; STUB_REGISTRY line 492 records only the symptom. (KIDS-REWARDS noted the 3 sequential_path configs as the visible symptom.)

*(Stage 1 browser evidence will confirm/adjust each of the above and add per-tile grades.)*

---

## §2 — Stage 1 Shelf Audit (browser evidence)

Method: Playwright sweep (`tests/e2e/features/studio-experience-audit.spec.ts`, STUDIO_AUDIT-gated) drove every tile as mom (Testworth family): expand card → [Customize] → record URL/dialog text/console errors + screenshot. Grades: **WORKS** (opens what the card promises) / **MISLEADING** (card copy ≠ behavior) / **BROKEN** (errors or dead behavior) / **MISSING** (spec'd, absent). "Open-grade" = what opens; deploy-grades come from Pass B + Stage 2.

### Tiles 1–24 (graded)

| # | Tile | Opens | Open-grade | Notes |
|---|---|---|---|---|
| 1 | Potty Chart (seed) | RepeatedActionChartWizard, 6 steps, name prefilled "Potty Chart" (screenshot) | **WORKS** | Milestone/coloring prefill in code; deploy path task_completion-keyed (sound). No bulk/AI on milestones. |
| 2 | Consequence Spinner (seed) | ListRevealAssignmentWizard draw flavor, lands on Add Items with 8 items prefilled; "Bulk Add with AI" present | **WORKS (open)** / deploy suspect | Deploy composes dead `randomizer_drawn` contract (F-14). |
| 3 | Extra Earning Opportunities (seed) | ListReveal opportunity flavor, jobs prefilled ("Wash the car"), per-item reward editors, bulk add | **WORKS (open)** / deploy suspect | Reward contracts dead-keyed (F-14); bridge-task path is the real payer (S1). |
| 4 | Reading Fun Activities (seed) | ActivityListWizard 6 steps on Subject step | **WORKS (open)** | Reward contracts dead-keyed (F-14). |
| 5 | Homeschool Variety Pack (seed) | ActivityListWizard | **WORKS (open)** | same |
| 6 | Honey-Do List (seed) | SharedTaskListWizard 5 steps | **WORKS (open)** | |
| 7 | Family Meeting Setup | MeetingSetupWizard — steps are DYNAMIC; sweep captured only Welcome/Couple/Review (all kid steps silently dropped) | **WORKS-with-fragility → F-20** | Root cause DB-verified: the wizard's kids filter requires exactly `relationship === 'child'` (MeetingSetupWizard.tsx:107); Testworth kids had `relationship=NULL` → every kid step (Family Council, 1:1s) vanished with ZERO messaging. Founder family has 'child' set (FamilySetup writes it), so it works there — but ANY member added by a path that skips `relationship` silently loses the wizard's core content. Writes meeting_schedules + calendar_events (correct homes). |
| 8 | Routine Builder (AI) | RoutineBuilderWizard (RoutineBrainDump) → hands to TaskCreationModal | **WORKS (open)** | |
| 9 | Create a List | UniversalListWizard 6 steps, purpose-first | **WORKS (open)** / naming FAILS Convention 249 | The composition doc §2.1 literally names "Create a List" as the canonical naming-review failure. Same violation: "Create a Rewards List", "Create a Shared To-Do". |
| 10 | Create a Rewards List | RewardsListWizard 4 steps | **MISLEADING (partial)** | Card promises bulk-paste brain dump; wizard has AI-suggest only (F-16). Deployed list is invisible post-deploy (F-19, see below). |
| 11 | Set Up a Progress Chart | RepeatedActionChartWizard blank | **WORKS (open)** | |
| 12 | Extra Earning or Consequence Spinner | ListReveal blank, type-pick step | **WORKS (open)** / deploy suspect | F-14. |
| 13 | Set Up Subject Activities | ActivityListWizard blank | **WORKS (open)** | F-14 on rewards. |
| 14 | Create a Shared To-Do | SharedTaskListWizard blank | **WORKS (open)** | |
| 15 | Simple Task | TaskCreationModal, type grid, Task preselected | **WORKS** | |
| 16 | Routine Checklist | TaskCreationModal, Routine preselected | **WORKS** | |
| 17 | Opportunity Board | TaskCreationModal, single Opportunity task | **MISLEADING** | Card promises a *board* w/ 3 sub-types + per-board member visibility; a single-task creator opens (F-05). Board creation lives in ListReveal wizard/Lists — this flagship tile routes to neither. |
| 18 | Sequential Collection | SequentialCreatorModal | **WORKS** | |
| 19 | Morning Routine (ex) | TaskCreationModal + title + Routine + sections preloaded from DB (screenshot: "Every Morning · Daily") | **WORKS** | |
| 20 | Bedroom Clean-Up (ex) | same path | **WORKS** | |
| 21 | Extra House Jobs Board (ex) | TaskCreationModal generic, title only — NO 8 jobs, no board | **MISLEADING** | F-04. |
| 22 | Curriculum Chapter Sequence (ex) | SequentialCreatorModal EMPTY — no 5 sample chapters | **MISLEADING** | F-04. |
| 23 | Reading List (ex) | SequentialCreatorModal "Create Reading List" + mastery/duration presets | **WORKS** | Presets are the promise; mom adds titles by design. |
| 24 | TSG Extra Jobs Randomizer (ex) | navigates /lists?create=randomizer; **no list_templates row titled 'TSG Extra Jobs Randomizer' exists** → blank randomizer; the promised 9+4 items have NO data source anywhere | **MISLEADING** | DB-verified. (Also: this tile flaked the sweep twice — ScrollRow last-card click interactions; harness note, separate from grade.) |

**F-19 (new, from tile 10 + code):** RewardsListWizard deploys `lists.list_type='reward_list'`, which the Lists page has no renderer/filter for, My Customized doesn't read, and no other surface lists — the ONLY consumer is RepeatedActionChartWizard's milestone dropdown. Once deployed, mom's prize list is invisible and uneditable everywhere. (Pass B7 confirms live.)

**Shelf-data debris:** `list_templates` contains a system row 'SODAS Decision Tool' with `list_type='guided_form'` — unreachable from any UI path (guided forms are task_templates); leftover seed.

**F-20 (new): inconsistent member-classification predicates across creation surfaces; MeetingSetupWizard silently degrades.** MeetingSetupWizard is the ONLY surface keying kid-detection on `relationship === 'child'`; every other wizard/picker keys on role/dashboard_mode. A NULL/other relationship (any member added outside FamilySetup.tsx:215) silently deletes the wizard's Family Council + kid-1:1 steps with no message. Fix class: one shared `isChildMember()` helper + a visible empty-state ("I don't see any kids on your roster yet — add them in Family Members"). *(Audit side-effect: Testworth kids' `relationship` set to 'child' / Mark to 'spouse' via service role 2026-07-04 to make fixtures production-like — the seed script should be updated to match; noted for the cleanup build.)*

### Tiles 25–50 (graded)

| # | Tile | Opens | Open-grade | Notes |
|---|---|---|---|---|
| 25 | Guided Form (blank) | captured NOTHING (dialogCount 0) | **RE-PROBE (Pass B)** | Other guided tiles opened fine; suspect flake or custom-subtype gap. |
| 26 | SODAS (blank) | sweep protocol error (context destroyed) | **RE-PROBE (Pass B)** | Transient; SODAS example opened fine. |
| 27 | What-If Game | GuidedFormAssignModal ("Fill your sections → Assign to child") | **WORKS** | |
| 28 | Apology Reflection | GuidedFormAssignModal, "A Note from Mom" section | **WORKS** | |
| 29 | SODAS Sibling Conflict (ex) | GuidedFormAssignModal — but **generic empty sections; the promised pre-filled Situation is nowhere** | **MISLEADING** | Code-confirmed: Studio builds the modal template from `getSectionsForSubtype()` only — example prefill content has no code path (F-04 class). |
| 30 | What-If: Friend Pressure (ex) | same — no pre-filled scenario | **MISLEADING** | F-04 class. |
| 31–37 | Shopping/Wishlist/Packing/Expenses/To-Do/Custom/Randomizer blanks | navigate /lists?create=<type>; inline create form opens ("New Shopping · Cancel · Create") | **WORKS** | Minimal form (title only) — friction low, but zero AI assist at this surface (Conv 251) and template reuse unreachable from here (F-18). |
| 38 | Shared Family Shopping List (seed) | UniversalListWizard, preset title "Set Up Your Family Shopping List" | **WORKS (open)** | |
| 39–42 | Weekly Grocery / Road Trip Packing / Birthday Wishlist / Homeschool Budget (ex) | /lists create form + **"Creating from template — items will be pre-filled."** banner | **WORKS** | **NEW-ZZ RESOLVED-STALE:** Worker 4's hydration wiring is real (template param carried; `default_items` hydration proven in Pass B4). Triage row NEW-ZZ describes the pre-2026-05-01 state. |
| 43 | Gamification Setup | member-picker overlay → GamificationSettingsModal | **WORKS** | Picker offers Special Adults (Amy/Kylie) as gamification targets — questionable but harmless. |
| 44 | Day Segments | same picker → settings modal | **WORKS** | |
| 45 | Coloring Page Reveal | same picker → settings modal | **WORKS** | |
| 46 | Reward Reveal | navigates /settings/reward-reveals (RewardRevealLibrary; clean empty state) | **WORKS** | Nav-away, but the destination delivers the promise. |
| 47 | Star / Sticker Chart | StarChartWizard 5 steps | **WORKS** | |
| 48 | Reward Spinner | **generic "Add Widget" picker showing Family-Hub widgets (Countdown / Today Is / Dinner Menu / Job Board)** — no spinner anywhere | **BROKEN** | `handleCustomize` widget_ branch found no `randomizer_spinner` starter config → fell back to WidgetPicker, whose category-key mismatch (F-17) leaves mostly hub entries visible. Card promise ("colorful spinner wheel linked to a randomizer list") completely undelivered. |
| 49 | Get to Know Your Family | GetToKnowWizard, 8 steps | **WORKS** | |
| 50 | Best Intentions Starter | navigates /guiding-stars — NO wizard exists | **MISLEADING** | F-06 confirmed in browser. |

**Fixture note:** Testworth carries leftover `OPPSURF *` lists from the parallel OPPORTUNITY-SURFACES session (their spec sweeps on next run) — visible in captures, ignored by this audit.

### Tracker tiles (51–89): all 39 starter-config tiles

All 39 tiles open `WidgetConfiguration` with the correct widget type + visual variant (Streak/flame, Habit Grid/bujo, Tally/star chart/coin jar/thermometer/progress bar, Step Path, Countdown, Mood, Leaderboard, Allowance Calculator, Badge Wall, Daily Check-In/Checklist, Before & After, Completion/donut…), member pills, size, config fields, Reward Reveal attach, "Show in Rhythms", "Deploy to Dashboard". Zero console errors. **Open-grade: WORKS ×39.** Deploy-grade via Pass B8.

Caveats:
- **"Prize at Goal"/"Prize at End" fields promise with no firing mechanism and no user-visible caveat** (streak + sequential_path; code comments acknowledge the gap — WidgetConfiguration.tsx:632-637, 689-692 — the UI doesn't). MISLEADING-class until tracker goal detection ships (factory pack P4) or the label is honest.
- **Shelf clutter / findability:** 39 cards in ONE horizontal scroll row, with near-duplicates ('Countdown' + 'Countdown to Event', 'Reading Log (Books)' + 'Reading Log', six Tally variants) and no sub-grouping, no search coverage (section is excluded from Studio search filtering — F-07). The DB `category` labels that WOULD group them are the same ones mismatched with WidgetPicker keys (F-17).

### Stage 1 open-grade tally (89 tiles)

- **WORKS:** 74 (incl. all 39 tracker tiles)
- **MISLEADING:** 8 — Opportunity Board (blank), Extra House Jobs Board, Curriculum Chapter Sequence, TSG Extra Jobs Randomizer, SODAS Sibling Conflict, What-If: Friend Pressure, Best Intentions Starter, Create a Rewards List (partial)
- **BROKEN:** 1 — Reward Spinner (drops into wrong picker; F-17)
- **RE-PROBE:** 2 — Guided Form blank, SODAS blank (Pass B9)
- **WORKS-with-fragility:** 1 — Family Meeting Setup (F-20 silent kid-step loss)
- Plus deploy-suspect flags on ListReveal (both flavors) + ActivityList (F-14 dead contract keys) pending Stage 2.

### Convention 255 friction review (wizard-wide, from Pass A/B evidence)

| Checklist question | State across the shelf |
|---|---|
| 1. Outcome-named? | Seeds mostly yes; three blank wizards fail naming review outright — "Create a List" (the composition doc's own canonical failure example), "Create a Rewards List", "Create a Shared To-Do". Tile names also collide confusingly ("Extra Earning Opportunities" seed vs "Extra Earning or Consequence Spinner" blank). |
| 2. 60-second saveable skeleton? | NO wizard can save a partial skeleton as an artifact; 4 wizards silently localStorage-draft (F-02), the other ~10 creation surfaces lose everything on close. "Minimum to save: nothing" is unmet everywhere. |
| 3-5. Hard decisions deferrable / AI fill on skip? | No per-field "Let AI help" exists anywhere; no per-tab "Let LiLa suggest" exists anywhere (Convention 251 largely unimplemented). AI assist exists only as: items-level AI-suggest (RewardsList, ListReveal), items-level bulk parse (5 surfaces), whole-routine parse (RoutineBuilder). Steps are individually skippable in most wizards (milestones optional, etc.) — decent. |
| 6. Composition validation warnings? | None found (Convention §2.8 unimplemented — e.g. nothing warns "this reveal's Reward List is empty", "this opportunity list has no roster"). |
| 7. Duplicable? | Routines yes (chooser flow); everything else no (F-03 broken button; wizard outputs not duplicable at all — F-08). |
| 8. Bulk-add on multi-item fields? | 5 of ~10 multi-item surfaces (see F-16 classification). |
| 9. Accepts Haiku-pre-populated entry? | Only the 6 NLC-routable wizards; prefill loses memberName; all other wizards blank-start only. |

### Pass B — creation-flow + probe evidence (browser, DB-asserted)

**B1 — NLC live probes (F-01 user-facing proof):**
| Mom's words | NLC outcome | Grade |
|---|---|---|
| "A chore board for my kids where they can earn money — vacuum $2, unload dishes $1, fold laundry $1.50" | **Hard failure**: "I couldn't quite figure that out" + 6 chips | **BROKEN for the flagship use case** — this is the exact outcome the opportunity wizard exists for |
| "A potty chart for Ruthie with a sticker for every trip and a prize after 10" | High confidence → Progress Chart wizard opened | WORKS — but extracted `memberName: Ruthie` is **discarded** (`handleNLCOpenWizard` maps only chartName/actionTaskName), so the Assign step starts empty |
| "A shared grocery shopping list my husband and I can both add to" | Routed to **Create a Shared To-Do** (claim-based) | **WRONG WIZARD** — the actual shopping wizard (UniversalListWizard/shared_shopping) is unreachable from NLC |
| "A morning routine for my kids — make bed, brush teeth…" | Medium confidence → proposed **Set Up a Progress Chart** | **WRONG WIZARD** (RoutineBuilderWizard unreachable) + restate grammar bug: "It sounds like you want to Mom wants to track…" |

**B2 — Drafts lifecycle:** closing RewardsListWizard silently saves (no §2.2 prompt — dialogCount 0 at close); draft appears in Drafts tab with title + timestamp; Resume restores the typed title. Confirms F-02's shape exactly.

**B3 — Customized Duplicate:** first probe failed to locate the control — Duplicate lives behind a "More options" (⋯) menu on the card (discoverability note); re-probe with the menu path below.

**B4b — Lists page's own [+ New List]:** type picker + create form contain ZERO template affordance — F-18 confirmed: templates (including mom's own "Make Reusable" saves) deploy only via Studio.

**B5 — Sequential blank end-to-end: WORKS.** SequentialCreatorModal → Jordan + title + 2 items → `sequential_collections` row (total 2, active 1) + child `tasks` at positions 0/1, first active, assignee correct.

**B6 — Opportunity Board blank end-to-end: F-05 fully confirmed.** Saving produced ONE `tasks` row `task_type='opportunity_repeatable'` with `assignee_id=NULL`, zero lists. No board, no member visibility, promised sub-type/claim-lock structure never surfaced.

**B8 — Tracker deploy:** "Morning Routine Streak" tile → WidgetConfiguration → Deploy to Dashboard wrote a correct `dashboard_widgets` row (template streak, is_on_dashboard=true, assigned to mom by default — no prompt to pick the kid the card copy implies). Dashboard render check was a probable false negative (widget grid lazy-renders below the fold) — settled with a scrolled re-check in Stage 2. **Default-assignee note:** the tile promises kid-tracking outcomes ("Morning Routine Streak") but deploys to MOM unless she notices the member pills.

**B9 — Guided forms re-probe:**
- Blank "Guided Form" opens "Assign Custom Form" with EMPTY "You fill:/Child fills:" and **no visible section-builder** — the card's core promise ("Mom defines sections") has no authoring surface here (custom guided-form authoring appears reachable nowhere on this path). Provisional BROKEN/MISSING for the custom subtype — cleanup slice must give custom forms a section editor (or route to one).
- Blank SODAS opens correctly with all 5 sections + child-fill markers. WORKS.
- **SODAS Sibling Conflict example: field-value check returned `[""]` — the promised pre-filled Situation is EMPTY. MISLEADING confirmed by value assertion.**

### F-21. PRODUCTION P0: the Progress Chart / Potty Chart wizard has NEVER been deployable — TWO invalid values in its first insert
`RepeatedActionChartWizard.tsx:281-287` inserts its action task with `status: 'active'` AND `source: 'studio'`. DB-probed live 2026-07-04:
- `status: 'active'` violates `tasks_status_check` (allowed: pending/in_progress/completed/cancelled — set by migration 100023, **April**, i.e. BEFORE Phase 3.7 shipped) → **the wizard's deploy has failed since its build day (2026-05-04)**. Phase 3.7's "6/6 E2E passing" therefore never exercised a real chart deploy — retroactive-verification implication for that build's close-out.
- `source: 'studio'` additionally violates `tasks_source_check` — **corrected by the ST-0 worker's migration-history sweep (2026-07-04): `'studio'` and `'wizard'` have NEVER existed in ANY version of that constraint back to its introduction in migration 100023.** Nothing dropped them; Phase 3.7 shipped writes against values that were never legal. (My earlier "100262 dropped them" reading was wrong — 100262 merely rebuilt the list they were never in.)
Mom-facing behavior: fully valid Review (name, action, star chart target 50, Casey assigned) → Deploy → generic "Something went wrong. Please try again." → zero rows anywhere (S2 browser run + screenshot + empty DB). Blast radius: the flagship Phase 3.7 wizard, its Potty Chart seed (the founder's marquee example), and NLC's only working high-confidence route. Also explains `wizard_templates`=0 for this wizard (deploy aborts first).
**Fix shape (ST-0 hotfix):** wizard insert → `status:'pending'` + restore `'studio'` to the source CHECK (provenance value worth keeping) + a regression test that (a) walks each wizard deploy end-to-end against the live DB or (b) asserts every `source:`/`status:` literal written in `src/` is ⊆ the live constraint enumerations — the Phase-3.8-era bug class has now shipped twice.

### F-23. wizard_templates writers use a nonexistent column shape — solves F-08's 0-rows mystery; blocks the chart wizard's success screen (found by the ST-0 worker, 2026-07-04)
`wizard_templates`' real schema (migration 100229 / live_schema) has `template_type` (NOT NULL), `title`, `template_source`, `config`, `original_author_id` — **no `wizard_type`, no `created_by`, no `template_name`**. Yet:
- `RepeatedActionChartWizard.tsx:~424` inserts `{wizard_type, created_by, ...}` and omits NOT-NULL `template_type` → throws INSIDE the main deploy try → even after ST-0's fix, the success screen never shows and `clearDraft()`/`setDeployed()` never run (the task/widget/contracts writes land first, so the deploy DOES work — mom just isn't told). → **ST-A scope.**
- `ListRevealAssignmentWizard.tsx:949` inserts `{wizard_type, template_name, ...}` → fails, silently swallowed by its try/catch-ignore.
- **F-23-micro-fix worker addendum (2026-07-04):** there is a THIRD failure layer — `wizard_templates.template_source` has `CHECK (template_source IN ('system','family','community'))`, and `'wizard'` violates it. So `SharedTaskListWizard.tsx:388` (which passes `template_source: 'wizard'`) is ALSO broken despite its otherwise-correct column shape — **all three writers have always failed**, fully explaining `wizard_templates = 0 rows`.
**Status:** the chart wizard's writer is FIXED (micro-fix 2026-07-04: correct columns + `template_source: 'family'` + isolated try/catch so this non-critical record can never block the success screen again; pinned by the success-screen + row assertions in progress-chart-deploy.spec.ts). ListReveal + SharedTaskList writers remain for **ST-A item 11**; ST-D builds the read side on top.

## §3 — Stage 2 Integration Scenarios S1–S5

**S2 — "Reading tracker for Casey with a prize at her goal": BROKEN in production (F-21).** Wizard walk to a fully valid Review + Deploy → nothing created. Settled; no further verification possible until the constraint fix ships. Milestones step honesty note: milestones are optional and clearly framed; the star-chart target (50) renders — but the streak/sequential-path "Prize at Goal" widget fields remain the un-caveated non-firing promise (Bucket 2 firing / Bucket 1 label honesty).

**S5 — "Same as S1 via MindSweep brain-dump": Convention 254 MISSING, confirmed at the surface.** The chore-board + potty-chart dump produced plain capture/classification UI (queue count incremented), zero composition-proposal language. Code level: no configuration-worthy concept exists in `mindsweep-sort` or any client file (explicit Phase 3.7 do-not-build; the convention was written as if shipped).

**S1 — "Chore board for my kids with money rewards": graded.**
- **Path friction (real mom experience):** NLC hard-fails on this description (double-proven), so mom lands on the error chips / shelf tile. Driving the blank ListReveal wizard: type-pick → **Bulk Add with AI parsed "Vacuum the living room $2 / Unload the dishwasher $1 / Fold laundry $1.50" perfectly** into claimable money items — the bulk path is genuinely good.
- **Deploy layer WORKS:** `lists` row (`is_opportunity`, `is_shared`, `eligible_members=null`) + 3 items with correct `reward_type/amount/claimable` + wizard's contracts + allowance contract created.
- **F-14 corroborated with live rows:** the 4 contracts are keyed `source_type='list_item_completion'` (money_godmother ×3 + allowance) — a deed type nothing fires. They will sit as dead rows on mom's /contracts page for every board ever deployed.
- **Sharing scope finding (replaces the earlier eligible_members-leak hypothesis, retracted):** "Who Can Browse" defaulted to sharing with ALL EIGHT members — including both Special Adults (Amy, Kylie) and mom herself. A kids' earning board should not default to Special Adults. (Alex saw the board; the Casey-negative check is judged a load-timing false negative given identical shares.)
- **Kid claim UX:** the board card renders on the kid's Opportunities tab; items require tap-through into the board browse (OpportunityListBrowse). The claim→bridge-task→complete→approve→pay chain is NOT wizard-specific and was verified 8/8 by OPPORTUNITY-SURFACES (2026-07-03) against shape-identical boards; adopted as coverage. Net money-path truth: **kids get paid via the bridge-task snapshot path; the wizard's own "automatic reward delivery" contract layer is inert** — the card's "compose contracts under the hood for automatic reward delivery" is technically true and functionally dead.

**S4 — "Shared shopping list the whole family adds to": BROKEN (silent partial deploy) — F-22.**
Driving the SEEDED "Shared Family Shopping List" wizard (the founder's Composition D flagship): the app logged **"List wizard deploy failed:"** (real console error from UniversalListWizard.tsx:480) while leaving a **half-deployed result**: `lists` row created (shopping, always-on, shopping-mode ✓) with 4 items — but **`is_shared=false`, zero `list_shares`** (Mark sees nothing), and the list was **titled "Shopping / groceries" — the purpose-tile label** (the preset title fallback names the list after the tile when mom doesn't type a name). Deploy's catch block only console-logs: **no user-facing error, wizard stays open → mom's natural retry creates duplicate half-lists.** Also: the preset defines 10 exampleItems across 6 sections with `defaultSharingMode: 'specific'` + `defaultAnyoneCanAdd: true` (listPresets.ts:80-108) — only 4 items landed and no shares, so the deploy diverged from the preset's own intent; the shelf card additionally overpromises ("across 8 store sections" = the suggestedSections list, not the item pack). Cleanup slice must: root-cause the throw point (share step or later — the wizard's write sequence is createList→items→shares→activity_log; note `useShareList` writes `shared_with`+`member_id`+`permission` and flips `is_shared`, and S1 proved that path works, so suspicion falls on this wizard's sharing-step state or its `sharingMode` never being set by the preset), surface deploy errors to mom, make deploy atomic-or-resumable, honor the preset's item pack, and never title a list after a tile label silently. *(Audit-probe note: my raw `list_shares` inserts failed RLS because they omitted `shared_with` — probe-shape error, retracted; app-path shares are RLS-fine.)*

**S3 — "Morning routine with a surprise activity each day": WORKS end-to-end.**
Routine Builder (AI) parsed the natural-language description into "Every Morning · Daily" with 4 steps; handed off to TaskCreationModal with sections preloaded; Assign & Create to Jordan wrote the template + sections + routine task; **Jordan's Guided dashboard renders it.** Linked-step affordance is discoverable in the routine editor (`linkAffordanceVisibleInEditor: true`). Composition gap worth fixing in ST-B: the parser rendered "a surprise fun activity each day" as a STATIC step — it does not detect randomizer-link opportunities or propose the linked-randomizer composition (Composition A's step-2 pattern); mom must already know the linked-step editor exists.

### Stage 2 scorecard
| Scenario | Grade |
|---|---|
| S1 chore board w/ money | NLC path BROKEN; wizard deploy WORKS (bulk-AI-add excellent); reward contracts DEAD (F-14); pay rides bridge-task path (OPPSURF-verified); shares default to everyone incl. Special Adults |
| S2 reading chart w/ prize | **BROKEN — never deployable (F-21 P0)** |
| S3 routine w/ surprise step | WORKS (static-step composition gap noted) |
| S4 shared shopping list | **BROKEN — silent partial deploy (F-22)** |
| S5 MindSweep composition | MISSING (Convention 254 unbuilt) |

## §4 — Cleanup Design (slice plan) — FINAL (Stage 2 folded in)

*Stage-2 additions:* F-21 → new **ST-0 hotfix slice** (ships first; dispatch prompt in the active build file). F-22 → ST-A gains the UniversalListWizard deploy repair (root-cause the throw, surface errors, atomic-or-resumable deploy, honor preset items/sharing, no tile-label titles) . ST-B gains the S3 composition gap (routine parser proposes linked-randomizer steps for "surprise/random activity" language) and S1's board-sharing default fix (kids-boards should not default-share to Special Adults + mom).

### §4.1 Four-bucket reclassification (founder ruling 2026-07-04: default flips to BUILD)

**Bucket 1 — BUILD IN THIS CLEANUP**
Founder-explicit: Studio Intelligence Phase 2 full set (intent search over capability_tags, use-case browse, "Best for" pills, My Library unified tab, post-creation recommendations); server-backed drafts (`is_draft` schema + migrate localStorage drafts forward + §2.2 prompt/reopen UX); bulk-AI-add on every multi-item wizard (classification below); widget_starter_configs canonical category scheme + regression test; color_reveal + gameboard built-or-pulled; activity-list scheduling wiring (`lists.schedule_config`); NLC widened to every wizard type + dedicated Edge Function.
Audit-found breakage joining Bucket 1: F-03 (Duplicate rewrite: deep-copy + valid task_type + error surfacing), F-04 (example prefills: opportunity jobs, sequential chapters, guided-form situations, TSG items — seed the missing data + load paths), F-05 (Opportunity Board tile → board-shaped creation), F-06 (Best Intentions Starter: build the wizard or rename the card), F-08/Conv-250 (wizard_templates read-side: Customized lists wizard deployments; reopen re-launches wizard pre-populated), F-14 (rewire ListReveal/ActivityList reward + draw contracts onto fired deed types — or build the producers; S1/S2 evidence decides), F-16 (RewardsList bulk-add + card copy truth), F-18 (template deploy reachable from Lists page), F-19 (reward_list lists visible/editable somewhere), F-20 (shared isChildMember() + visible empty state), B6 (opportunity blank creates unassigned invisible task), B9 (custom guided-form section authoring surface), Use-as-is button honest behavior (F-13), Studio search covering all sections + tags (F-07), NLC restate grammar + memberName prefill drop, wizard outcome-naming review (Conv 249: "Create a List" et al.), tracker-shelf grouping/dedupe, prize-field honesty labels (label fix here; firing is P4), Testworth seed relationship values, `window.confirm`→ModalV2, reload()-free Customized actions.
**Bulk-add classification of the 13 wizard files without it:** creation surfaces with multi-item entry needing bulk-AI-add = RewardsListWizard (items), RepeatedActionChartWizard (milestones — borderline, propose AI-suggest instead), StarChartWizard (single-goal — N/A), GetToKnowWizard (guided Q&A — N/A), MeetingSetupWizard (structured pickers — N/A), ListRevealAssignmentWizard (HAS bespoke bulk — unify onto shared `BulkAddWithAI`), SetupWizard/ConnectionOffersPanel/DashboardDeployPicker/RecurringItemBrowser/RoutinePicker/SegmentPicker/WizardTagPicker (pickers/sub-steps — N/A per founder). Net new deployments: RewardsList (+unify ListReveal); AI-suggest for RepeatedActionChart milestones.

**Bucket 2 — OWNED BY A FACTORY PACK (evidence handed off, not built here)**
- Tracker-goal→prize firing — P4 (evidence: R2 registry + B8/S2 + honesty-gap sites WidgetConfiguration.tsx:632/689)
- Per-step routine rewards — P4 (evidence: STUB_REGISTRY line 37; zero reward columns on task_template_steps)
- Community/cross-family template sharing — pack TBD (wizard_templates sharing fields exist unread)
- Offline activity lists — PRD-33
- Activity-pattern analytics — PRD-32
- PRD-05C optimizer surfaces
- LiLa context from activity completions + `studio_create_guide` conversational mode + school-year planner — LiLa/PRD-05 pack (Convention 247 pipeline work, not Studio-surface work)

**Bucket 3 — DELIBERATE DESIGN DECISIONS (do not reverse; founder review list with original rationale)**
- Surprise-Me same-day redraw refusal — Convention #163: "Refresh shows the same item — that's the feature, not a bug."
- Sequential-vs-randomizer mastery approval queue non-unification — Convention #161: "a unified cross-source mastery queue is explicitly NOT built."
- Mom voluntary draw from Surprise Me — Build J row 42: "Intentional — switch to Focused mode to draw manually."
- BookShelf `linked_bookshelf` source type deferral — Build J row 43: Reading List sequential template is the chosen path.
- Mastery evidence camera upload (Build J row 41, Post-MVP) — not Studio-scope; stays in the follow-up queue unless founder pulls it in.

**Bucket 4 — GENUINELY BLOCKED**
- None found blocked on missing infrastructure once Bucket 1 lands. (Closest candidate — post-creation smart recommendations — is buildable on capability_tags + created-row context; founder-explicit Bucket 1.)

### §4.2 Slice plan — DRAFT (dispatch prompts at close-out)
- **Slice ST-A — Shelf truth:** every MISLEADING/BROKEN tile fixed (F-03/04/05/06/13/16, B6, B9, Reward Spinner, TSG data, guided-form prefill, Best Intentions wizard-or-rename); card copy = behavior everywhere; Playwright pin per tile.
- **Slice ST-B — NLC v2:** dedicated Edge Function; router covers the full wizard catalog incl. UniversalList/RoutineBuilder/SequentialCreator/StarChart/MeetingSetup/GetToKnow; "none" escape + full-catalog fallback; restate fix; prefill plumbed per wizard (incl. memberName→Assign).
- **Slice ST-C — Drafts v2:** server-backed (`is_draft`/draft table), all creation surfaces, §2.2 close-prompt + reopen-prompt + multi-draft, localStorage migration.
- **Slice ST-D — Studio Intelligence Phase 2:** tag/intent search across ALL sections, use-case browse, Best-for pills, My Library (task_templates + list_templates + wizard_templates + reward_list lists), post-creation recommendations; wizard_templates reopen-editable (Conv 250).
- **Slice ST-E — Tracker shelf & pickers:** canonical category keys + mismatch test; Reward Spinner starter config; color_reveal/gameboard decision; shelf grouping + dedupe; prize-label honesty; B8 default-assignee UX.
- **Slice ST-F — Reward-wire truth:** F-14 remediation per S1/S2 evidence (rewire wizard contracts to fired deed types or build list_item_completion/randomizer_drawn producers — decision matrix in §3); dead-contract cleanup for existing families; eligible_members vs list_shares reconciliation (S1 leak).
- **Slice ST-G — Bulk-add + misc integration:** Bucket-1 bulk-add deployments; activity schedule wiring; F-18 Lists-page template path; F-19/F-20.
Sequencing: ST-A → ST-F → ST-B → ST-C → ST-D → ST-E → ST-G (truth first, then money-path, then intelligence).

## §5 — Founder ruling folded in (received mid-audit, 2026-07-04)

**Deferred/"do-not-build"/stub items: the default FLIPS TO BUILD.** Stage 3 must reclassify every deferred item found by this audit into exactly one bucket:

1. **BUILD IN THIS CLEANUP (default).** Founder-explicit members: full Studio Intelligence Phase 2 set (search bar, use-case browse, capability-tag "Best for" pills, My Library tab, post-creation recommendations); server-backed drafts per Convention 250 (`is_draft` in schema; migrate existing localStorage drafts forward, don't strand); bulk-AI-add on every wizard with multi-item entry (classify the 13 no-bulk wizard files first — pickers/sub-steps like RoutinePicker/SegmentPicker are not creation surfaces); widget_starter_configs category-key fix (ONE canonical scheme, fix seeds or picker, + a test that fails on future mismatch); color_reveal + gameboard built real OR pulled from picker (no "Coming soon" traps either way); activity-list scheduling wiring (`lists.schedule_config` exists — connect it); NLC widened to every wizard type + moved to its own dedicated Edge Function (one-tool-one-function convention).
2. **OWNED BY A FACTORY PACK** — do not build here; hand evidence to the pack. Known members: tracker-goal→prize firing (P4), per-step routine rewards (P4), community/cross-family template sharing, offline (PRD-33), analytics (PRD-32), PRD-05C.
3. **DELIBERATE DESIGN DECISION** — do not reverse; list for explicit founder review with original rationale quoted (e.g. Surprise-Me same-day redraw, Convention #163; randomizer mastery queue non-unification, Convention #161).
4. **GENUINELY BLOCKED** — name the exact missing infrastructure.

**Extra hands-on items folded into Stage 1/2:** (a) settle NEW-ZZ vs Worker-4 by deploying a list template through BOTH paths (Studio shelf [Customize] AND Lists page) and recording what each creates; (b) verify whether `wizard_templates` "My Customized" records reopen into an editable wizard per Convention 250 or are write-only. *(Code answer to (b) already in hand: nothing reads `wizard_templates` — `useCustomizedTemplates` queries task_templates + list_templates only, so they are write-only today; browser confirms the user-visible absence.)*

**Close-out task:** Phase 3.7/3.8 feature-decision files have empty Post-Build Verification tables — this audit's graded matrix becomes their retroactive verification and must be copied into both files at close-out.

## §6 — Audit harness notes (for close-out hygiene)

- Audit specs (STUDIO_AUDIT-gated, never run in CI): `tests/e2e/features/studio-experience-audit.spec.ts` (Pass A), `studio-experience-audit-b.spec.ts` (Pass B), `studio-experience-scenarios.spec.ts` (S1–S5). **Founder ruling 2026-07-04: KEEP all three** — per Convention #277 they are the Studio tour the cleanup slices re-run for their Mom-UI Verification tables. (`studio-audit-probe.spec.ts` throwaway was deleted.)
- Artifacts: `<scratchpad>/studio-audit/` — pass-a.ndjson (89 tiles), pass-b.ndjson, scenarios.ndjson + ~120 screenshots.
- Fixtures: all rows prefixed `STUDIOAUD`, swept in beforeAll/afterAll via service role. Testworth `relationship` values updated to production-like ('child'/'spouse') — seed script should adopt this.
- Harness lessons: (1) Studio cards hover-expand 200→280px, shifting ScrollRow layout mid-click — audit clicks need opened-dialog verification + retry (also a minor real-user jumpiness note). (2) playwright.config has `actionTimeout` unset (=unbounded) — locator waits can hang a run for the full test timeout; pass explicit per-action timeouts in tour specs. (3) The PowerShell/Bash tool working directory is shared and drifts with `cd` — Playwright then resolves spec paths against the wrong root and reports "No tests found". (4) An unrelated dev server on 5173 died mid-run once (parallel-session leftover); Playwright-managed webServer is the stable choice.

## §7 — Close-out checklist
- [x] Retroactive verification sections appended to `Phase-3.7-Wizards-Seeded-Templates.md` + `Phase-3.8-Activity-Management.md` (2026-07-04)
- [ ] STUB_REGISTRY: correct NEW-ZZ-adjacent rows (list-template hydration is wired); add findings F-01…F-22 pointers; note wizard_templates write-only state *(deferred to cleanup-build close-out — shared file, parallel sessions live)*
- [ ] TRIAGE_WORKSHEET: mark NEW-ZZ resolved-stale; attach this audit to NEW-L / NEW-R / NEW-K rows *(same deferral)*
- [x] `studio-audit-probe.spec.ts` deleted; three audit-tour specs kept (STUDIO_AUDIT-gated, never run in CI) — founder decides keep/delete at cleanup close-out
- [x] STUDIOAUD fixture residue: ZERO (verified 2026-07-04; also swept the unprefixed S4 half-deploy list, orphan B5 "Chapter One/Two" child tasks, and confirmed no bridge tasks/wizard activity rows remained)
- [ ] Update seed script with relationship values (one-line change in `seed-testworths-complete.ts` MEMBERS — cleanup build)
- [x] ST-0 hotfix dispatch prompt written into the active build file; ST-A…ST-G prompts authored at gate approval per plan
