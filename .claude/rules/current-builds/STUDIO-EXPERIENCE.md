# Active Build: STUDIO-EXPERIENCE — Studio Surface Audit + Cleanup

> **Status: ST-0 + F-23 MICRO-FIX COMPLETE, VISUALLY VERIFIED, COMMITTED `9676734` (2026-07-04) — NOT PUSHED (founder confirms pushes). Next action: founder pushes, then pastes ST-A.**
> Ledger: migration 100283 applied to production; wizard insert fixed (status 'pending', wizard_templates correct shape + `template_source:'family'` + isolated try/catch); pins green (constraint vitest 13/13; permanent deploy pin incl. success-screen + wizard_templates-row assertions, 1/1); Convention #277 visual pass done by Claude (desktop 1440 + mobile 375 full flow → "Chart deployed!" screen → Casey dashboard/tasks render — Mom-UI table below); zero STUDIOAUD residue; commit = 4 files + hook-required live_schema.md regen.
> F-21 corrected ('studio'/'wizard' were NEVER in any constraint version — broken since birth). F-23 has a THIRD layer: `template_source` CHECK ('system'/'family'/'community') — `'wizard'` illegal, so ALL THREE wizard_templates writers were broken; chart wizard fixed, ListReveal + SharedTaskList remain in ST-A item 11.
> **Founder gate resolutions (2026-07-04):** (1) ST-0 approved, dispatched immediately. (2) Slice plan approved as sequenced ST-0→A→F→B→C→D→E→G with TWO RIDERS: **(a) every slice's regression pin must exercise REAL deploys with DB assertions** — the Phase 3.7 "6/6 passing without a real deploy" failure mode is the enemy this cleanup exists to kill; **(b) kids'-earning-boards-visible-to-Special-Adults (S1 finding) is a scoping-correctness item, not polish** — fixed in the first truth slice that touches it (assigned: ST-A) with a leak-pass-style probe pinning it; ST-F must keep that probe green. (3) Audit tour specs KEPT — per new Convention #277, Claude-driven Playwright tours are the standard visual-verification mechanism; the three STUDIO_AUDIT-gated specs become the Studio tour each cleanup slice re-runs for its Mom-UI Verification table.
> Auditor: Fable session 2026-07-04 (STUDIO-EXPERIENCE dispatch).
> Authority: `claude/feature-decisions/Studio-Experience.md` (full evidence record — read it first) → this file (scope + slices) → founder ruling 2026-07-04 (deferred items default to BUILD; four buckets).
> Founder acceptance bar (verbatim): "We need every single thing in there to be user friendly and accurate, and to end up with a fully integrated list, tracker, reward system, etc. completely customized, able to both describe in normal language and then enter/edit the prefilled forms."

---

## The headlines the founder needs

1. **P0 (F-21): the Progress Chart / Potty Chart wizard has NEVER been deployable in production.** Its first insert uses `status:'active'` (never valid — the status CHECK predates Phase 3.7) AND `source:'studio'` (dropped when migration 100262 re-enumerated `tasks_source_check`). Every deploy since the wizard shipped (2026-05-04) fails with a generic error; Phase 3.7's "6/6 E2E passing" never exercised a real deploy. DB-probed + browser-verified. **Deserves a hotfix ahead of the full cleanup** (fix the insert values + restore 'studio' to the CHECK + a constraint-vs-code enumeration regression test — this bug class has now shipped twice).
2. **"Describe what you want" (NLC) fails the brand promise.** It knows only 6 of ~20 outcomes with no escape hatch: the founder's headline description ("chore board where kids earn money…") hard-fails; "shared grocery list" routes to the wrong wizard; "morning routine" proposes a Progress Chart; extracted kid names are discarded. (F-01, B1 probes.)
3. **The reward wiring under two wizards is dead on arrival (F-14):** ListRevealAssignmentWizard + ActivityListWizard author contracts against deed types (`list_item_completion`, `randomizer_drawn`) that no code ever fires. Money that flows does so only via the separate bridge-task snapshot path.
4. **Shelf honesty:** 8 MISLEADING tiles + 1 BROKEN tile + confirmed dead buttons ("Use as-is" = Customize; non-routine Duplicate always fails a NOT-NULL constraint silently — F-03/F-13).
5. **Convention-vs-reality drift:** Conventions 250 (server drafts + prompts), 252 (bulk-add universality), 253 (NLC everywhere), 254 (MindSweep composition detection) are written as law but unimplemented or partial.
6. Positives worth keeping: routine examples, list-template hydration (NEW-ZZ is stale — Worker 4's fix is real), sequential creation, all 39 tracker tiles opening correct configs, gamification/growth wizards, drafts-tab basics.

## Findings index (full text in the evidence record)
F-01 NLC scope/escape · F-02 drafts localStorage/single-slot/coverage/UX · F-03 Duplicate constraint-dead · F-04 example prefills missing (opportunity/sequential/guided/TSG) · F-05 Opportunity Board tile ≠ board · F-06 Best Intentions wizard missing · F-07 search coverage/tags · F-08 wizard_templates write-only · F-09 reload()/no-confirm actions · F-10 tracker stubs hidden + picker mismatch · F-11 device-clock today · F-12 NLC surfacing details · F-13 Use-as-is · F-14 dead contract keys (live dead rows proven in S1) · F-15 Convention 254 unbuilt · F-16 RewardsList bulk-add card lie · F-17 widget category keys · F-18 Lists-page template path absent · F-19 reward_list invisible post-deploy · F-20 relationship predicate/silent degrade · **F-21 Progress Chart wizard never deployable (P0: status+source CHECK violations)** · **F-22 UniversalListWizard silent partial deploy (unshared, mistitled, preset items lost, retry-duplicates)**.

Stage-2 scenario scorecard: S1 wizard-deploy WORKS w/ dead reward contracts + everyone-shared default · S2 BROKEN (F-21) · S3 WORKS (linked-composition gap) · S4 BROKEN (F-22) · S5 MISSING (Conv 254).

## Four-bucket reclassification (per founder ruling)
See evidence record §4.1. Bucket 1 = everything above minus: tracker-goal firing + per-step rewards (→ P4 pack), community sharing / offline / analytics / PRD-05C / LiLa-context items (→ their packs), and the Bucket-3 deliberate decisions (Surprise-Me determinism #163, mastery queue non-unification #161, Surprise-Me manual draw, linked_bookshelf deferral, mastery evidence upload).

## Slice plan (dispatch prompts at gate approval)
- **ST-0 HOTFIX (ship first, tiny):** restore `'studio'` (+`'wizard'` if kept for tasks) to `tasks_source_check`; add the enumeration regression test (constraint values ⊇ every `source:` literal the codebase writes). Unblocks the flagship wizard in production.
- **ST-A Shelf truth** — every MISLEADING/BROKEN tile fixed; example prefills get real data paths; Opportunity Board tile → board flow; Best Intentions wizard-or-rename; Use-as-is honest; Duplicate rewritten (template_name + valid task_type + full config copy + error surfacing); custom guided-form section authoring; Reward Spinner tile lands on a spinner.
- **ST-F Reward-wire truth** — F-14 remediation (rewire wizard contracts onto fired deed types or build producers; dead-contract cleanup; eligible_members vs list_shares reconciliation).
- **ST-B NLC v2** — dedicated Edge Function; full wizard catalog + "none" escape + full-catalog fallback; restate fix; per-wizard prefill incl. memberName.
- **ST-C Drafts v2** — server-backed `is_draft`, all creation surfaces, §2.2 close/reopen prompts, multi-draft, localStorage migration.
- **ST-D Studio Intelligence Phase 2** — tag/intent search across ALL sections; use-case browse; Best-for pills; My Library (incl. wizard_templates read-side + reward_list); post-creation recommendations; Conv-250 reopen-editable wizard deployments.
- **ST-E Tracker shelf & pickers** — canonical category scheme + mismatch test; color_reveal/gameboard build-or-pull; spinner starter config; shelf grouping/dedupe; prize-label honesty; deploy default-assignee UX.
- **ST-G Bulk-add + integration** — RewardsList bulk-add (+ unify ListReveal's bespoke onto BulkAddWithAI); activity schedule wiring; F-18 Lists-page template path; F-19 reward_list surface; F-20 shared isChildMember; seed-script relationship values.
Sequence: ST-0 → ST-A → ST-F → ST-B → ST-C → ST-D → ST-E → ST-G.

## ST-0 HOTFIX dispatch prompt (ready to paste on gate approval)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the ST-0 hotfix worker for STUDIO-EXPERIENCE. One P0: the Progress
Chart / Potty Chart wizard (RepeatedActionChartWizard) has NEVER deployed in
production — its first task insert uses TWO values the live CHECK constraints
reject. Evidence: claude/feature-decisions/Studio-Experience.md F-21.

FIX (small, surgical):
1. src/components/studio/wizards/RepeatedActionChartWizard.tsx:281-287 —
   change `status: 'active'` → `status: 'pending'` (allowed set:
   pending/in_progress/completed/cancelled, migration 100023).
2. New migration (take the NEXT FREE number at creation time and re-check right
   before push — parallel sessions are landing migrations): rebuild
   tasks_source_check ADDING 'studio' and 'wizard' to the current 23-value list
   from migration 100278 (KIDS-REWARDS). Base the enumeration on 100278's body,
   NOT an older migration (copy-stale-body failure mode is documented in the
   KIDS-REWARDS build file).
3. Regression test so this bug class (shipped twice now: Phase 3.8 build-time,
   100262 re-enumeration) can't return: a vitest that greps src/ for every
   `source: '<literal>'` written to tasks inserts and asserts the set ⊆ the
   allowed list mirrored from the latest migration — PLUS extend the audit's
   deploy walk: a Playwright test that drives RepeatedActionChartWizard
   Name→Action→Display→Milestones→Assign(Casey)→Deploy and asserts the tasks +
   dashboard_widgets + contracts rows exist (fixtures STUDIOAUD-prefixed, swept;
   see tests/e2e/features/studio-experience-scenarios.spec.ts S2 for the exact
   walk + cleanup pattern).
PROOF: migration applied via supabase db push --linked; the new Playwright test
green; tsc -b clean; lint clean. NOTHING COMMITS until green + founder confirm;
selective staging (this fix's files only).
```

## ST-A…ST-G dispatch prompts (paste each into a FRESH session, in sequence, one at a time after the prior slice's sign-off)

**Universal rules baked into every slice (do not re-litigate in-session):**
- Rider (a): every regression pin drives the REAL creation flow in the browser and asserts the created DB rows via service role. A pin that only checks "the modal opened" or "the test suite passed" is a failed deliverable.
- Convention #277: after code-complete, re-run the Studio tour (`STUDIO_AUDIT=1 npx playwright test tests/e2e/features/studio-experience-audit.spec.ts`) plus your slice's own screenshots, and fill your rows in this file's Mom-UI Verification table from the tour output.
- Fixtures: STUDIOAUD prefix, service-role sweep in beforeAll+afterAll, Testworth family. Reference patterns: `tests/e2e/features/studio-experience-scenarios.spec.ts`.
- Migration protocol: take the next FREE number at file-creation time and re-check right before applying; if `supabase migration list --linked` shows unapplied migrations that aren't yours, apply only your own SQL via `supabase db query --linked -f <file>` (write idempotent SQL) instead of `db push`.
- NOTHING commits until your pins are green AND founder eyes-on clears; selective staging of your files only. Do not run other builds' suites.
- Evidence record: `claude/feature-decisions/Studio-Experience.md` — your requirement list is the findings named in your slice; grade yourself against the card copy + convention, not against "it compiles."

---

### ST-A — Shelf truth

```
⚙ STEP 1 (type this first): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest.

You are the ST-A worker for STUDIO-EXPERIENCE: make every Studio shelf tile do
exactly what its card promises. READ FIRST: claude/feature-decisions/
Studio-Experience.md (findings F-03/04/05/06/13/16/20/22 + B6/B9 + tiles table)
and .claude/rules/current-builds/STUDIO-EXPERIENCE.md (universal rules).

SCOPE (each item = fix + a real-deploy DB-asserted pin):
1. F-03 Duplicate (Studio.tsx:1364-1382): rewrite the non-routine branch —
   include template_name, map Studio type → DB task_type ('opportunity_claimable'
   →'opportunity' etc.), deep-copy config/reward/flag columns, surface errors
   (RoutingToastProvider pattern), invalidate queries instead of
   window.location.reload(). Same reload() removal for Archive + add a confirm.
2. F-04 example prefills: (a) Extra House Jobs Board — the example must open a
   BOARD creation flow prefilled with its 8 jobs + 2 connection items (route to
   ListRevealAssignmentWizard opportunity flavor with a preFill, mirroring
   CONSEQUENCE_SPINNER_PREFILL); (b) Curriculum Chapter Sequence — open
   SequentialCreatorModal with 5 sample chapters prefilled; (c) guided-form
   examples (SODAS Sibling Conflict / What-If Friend Pressure / Apology
   Reflection example) — the promised pre-filled mom sections must actually
   populate (plumb prefill content through GuidedFormAssignModal); (d) TSG Extra
   Jobs Randomizer — seed the missing list_templates row (9 chores + 4
   connection items per specs/studio-seed-templates.md) so the template param
   hydrates, or repoint the tile at a prefilled randomizer flow.
3. F-05 + B6: the "Opportunity Board" blank tile must open board-shaped creation
   (ListRevealAssignmentWizard opportunity flavor), not a single-task modal.
4. F-06: "Best Intentions Starter" — build the promised starter wizard (3-5
   intentions, uses existing best_intentions hooks) OR (founder default: build).
5. F-13: "Use as-is" on examples must actually deploy as-is (create the thing
   with the example's content + sensible defaults, confirm, done) — not alias
   Customize.
6. F-16: RewardsListWizard — deploy the shared BulkAddWithAI on its Add Rewards
   step (card already promises it).
7. F-22: UniversalListWizard deploy repair — root-cause the thrown error
   (deploy sequence createList→items→shares→activity_log; audit saw list+4
   items, no shares, error logged), surface failures to mom, make deploy
   resumable-or-atomic, honor the preset's 10 exampleItems + defaultSharingMode
   'specific', never silently title a list from the purpose-tile label (require
   or auto-suggest a name), close the wizard only on success.
8. RIDER (b) — SCOPING CORRECTNESS: ListRevealAssignmentWizard's "Who Can
   Browse" must default to KIDS only (never Special Adults, never mom) and the
   deployed board's visibility must actually honor the picks (today:
   eligible_members stays null + shares went to all 8 members incl. Special
   Adults). Write the board's audience to eligible_members AND scope shares
   accordingly. Pin with a leak-pass-style probe: deploy a board picking only
   Alex → assert via kid sessions that Alex sees it and Casey/Amy(special adult)
   do NOT, both at the Opportunities-tab layer and via direct list read.
9. F-20: shared isChildMember() helper (relationship OR role/dashboard_mode
   fallback) consumed by MeetingSetupWizard + anywhere else classifying kids;
   MeetingSetupWizard gets a visible empty-state when no kids resolve. Update
   tests/e2e/helpers/seed-testworths-complete.ts MEMBERS to set relationship
   ('child'/'spouse') — production data was already patched by the audit.
10. Card-copy truth pass: fix "Reward Spinner" tile routing stub-out until ST-E
   lands its starter config (acceptable interim: open WidgetPicker pre-filtered
   to randomizer_spinner with an honest note) — coordinate with ST-E scope; and
   fix NLC restate grammar ("It sounds like you want to {description}" — strip
   the model's third-person subject) + plumb memberName prefill into the
   repeated_action_chart route (Assign step preselect).
11. F-23 remainder (chart wizard already fixed by the 2026-07-04 micro-fix —
   use it as the reference implementation): fix ListRevealAssignmentWizard:949
   (nonexistent wizard_type/template_name columns, missing NOT-NULL
   template_type) and SharedTaskListWizard:388 (`template_source: 'wizard'`
   violates CHECK — allowed values are 'system'/'family'/'community'; use
   'family'). Correct shape: family_id + template_type + title +
   template_source:'family' + original_author_id + config, isolated in its own
   try/catch (non-critical provenance must never block a success screen).
   Pin: success screen shows AND a wizard_templates row exists after deploy,
   for BOTH remaining wizards (chart wizard already pinned).
PROOF: one Playwright spec tests/e2e/features/studio-shelf-truth.spec.ts with a
real-deploy DB-asserted pin per item above (incl. the rider-(b) leak probe);
tsc -b clean; Studio tour re-run for Mom-UI rows.
```

### ST-F — Reward-wire truth

```
⚙ STEP 1 (type this first): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest.

You are the ST-F worker for STUDIO-EXPERIENCE: make wizard-composed rewards
actually fire. READ FIRST: claude/feature-decisions/Studio-Experience.md F-14 +
S1 + §4; .claude/rules/current-builds/STUDIO-EXPERIENCE.md (universal rules).

THE PROBLEM: ListRevealAssignmentWizard (opportunity: per-item money/points/
custom contracts + allowance contract on source_type='list_item_completion';
draw: assign_task_godmother on 'randomizer_drawn') and ActivityListWizard (2×
'list_item_completion' contracts) author contracts against deed types NOTHING
fires (every fireDeed site = 'task_completion' or 'intention_iteration'; only
server producer = 'scheduled_occurrence_active'). Money currently flows only
via the OPPORTUNITY-SURFACES bridge-task snapshot path.

DECIDE-THEN-BUILD (present the decision in-session before coding, then do it):
Option 1 — fire the missing deeds: `consume_opportunity_list_item` RPC (the
write-back point for claimed board items) inserts a 'list_item_completion'
deed_firing keyed to the LIST id (contracts use source_id=listId) with
metadata carrying the item; randomizer draws fire 'randomizer_drawn' at draw
time. Then reconcile DOUBLE-PAY: the bridge-task snapshot path (task_rewards)
AND the contract would both pay — pick ONE payer per item type and make the
other a no-op for board items (recommended: contracts become the payer for
wizard boards; bridge snapshot stays for non-wizard boards — or simpler,
contracts stay authoring-only metadata and the wizards STOP creating dead
per-item contracts entirely and write reward config onto list_items only,
which the bridge path already honors — evaluate against /contracts page UX and
Convention #275 queue surfaces; document the choice in the evidence record).
Option 2 — stop authoring dead contracts (wizards write item-level rewards
only) + delete existing dead contract rows for wizard-created lists
(source_category IN ('opportunity_wizard','draw_wizard') with a migration
that archives rather than hard-deletes if contracts carry audit value).
EITHER WAY: draw-flavor behavior ("spin → task on kid's dashboard + reveal")
must actually work end-to-end — via the existing randomizer draw/promotion
machinery or a real 'randomizer_drawn' producer; prove it.
CLEANUP: whichever option, existing families' dead contracts get migrated/
archived so /contracts doesn't show inert rows.
PROOF (rider a): Playwright pin — deploy a money board via the wizard as mom,
Alex claims + completes + mom approves, assert financial_transactions credit
for Alex appears EXACTLY ONCE (no double-pay) with contract_grant_log/deed
evidence matching your chosen architecture; draw-flavor pin — deploy spinner,
trigger a draw, assert the task lands on the picked kid's dashboard (tasks row
+ dashboard render); keep ST-A's rider-(b) leak probe green; tour re-run.
```

### ST-B — NLC v2

```
⚙ STEP 1 (type this first): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest.

You are the ST-B worker for STUDIO-EXPERIENCE: make "Describe what you want"
worthy of the brand promise. READ FIRST: claude/feature-decisions/
Studio-Experience.md F-01/F-12/B1/S1/S3; Composition doc §2.9 (claude/web-sync/
Composition-Architecture-and-Assembly-Patterns.md); universal rules in the
active build file.

SCOPE:
1. Dedicated Edge Function `nlc-compose` (one-tool-one-function convention;
   follow the curriculum-parse scaffold: Haiku via OpenRouter, Zod I/O, cost
   logging, authenticateRequest + detectCrisis per SAFETY-BETA-GATE patterns).
   Client stops calling ai-parse for NLC.
2. Router covers the FULL creation catalog: the 6 existing wizard types PLUS
   universal_list (with preset + listType extraction), routine_builder (with
   description passthrough), sequential_creator, star_chart, meeting_setup,
   get_to_know, gamification_setup, task_quick_create — AND a first-class
   `none_confident` outcome. Fallback UX per §2.9: restate mom's words
   verbatim-faithfully (fix the "you want to Mom wants to" grammar — strip
   the model's third-person restate into second person) and offer the FULL
   catalog (not 6 chips), best-match first.
3. Prefill plumbing per wizard: every extracted field reaches its wizard
   (memberName → Assign preselect everywhere; items+amounts → ListReveal;
   listType/preset/title/items → UniversalListWizard; description → Routine
   Builder textarea; etc.). Every wizard must accept a prefilled entry state
   (Conv 255 Q9).
4. S3 composition gap: the routine parse prompt detects "surprise/random/
   pick one" step language and proposes a linked_randomizer step (marked in
   the parsed review UI, mom confirms; creates/links a randomizer list on
   accept — HITM).
5. NLC visible even while searching (F-07 interplay); input keeps mom's text
   on error.
PROOF (rider a): Playwright pin driving the four audit probe phrases (chore
board $, potty chart for Ruthie, shared grocery list with husband, morning
routine) end-to-end: correct wizard opens WITH prefill asserted (input
values, not innerText), and for the chore-board phrase continue to DEPLOY and
assert DB rows. Seed 20-30 real mom descriptions as a vitest against the Edge
Function's router (§2.9 beta-readiness note) with expected-wizard assertions.
tsc -b; tour re-run.
```

### ST-C — Drafts v2 (server-backed, Convention 250)

```
⚙ STEP 1 (type this first): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest.

You are the ST-C worker for STUDIO-EXPERIENCE: real save-and-return. READ
FIRST: claude/feature-decisions/Studio-Experience.md F-02/B2; Composition doc
§2.2; CLAUDE.md Convention 250; universal rules in the active build file.

SCOPE:
1. Schema: `wizard_drafts` table (id, family_id, member_id, wizard_type,
   title, state JSONB, last_saved_at, created_at; RLS owner+mom; migration
   per protocol) — chosen over per-primitive is_draft columns because wizard
   state is pre-primitive; document this decision against Convention 250's
   "primitives support is_draft" wording and flag for founder confirmation
   in your first message.
2. useWizardDraft rewritten server-backed with localStorage MIGRATION (on
   first load, existing local drafts upsert to the table then clear — never
   strand founder-family drafts) + multi-draft support (draftId real, not
   'new').
3. §2.2 UX: explicit close prompt ("Save as a draft to come back to?" /
   default-save on dismiss / discard requires confirm — ModalV2, replacing
   window.confirm), reopen prompt ("Continue last draft or start fresh?" with
   multi-draft picker; start-fresh preserves the old draft), a persistent
   "Save & Come Back" button in SetupWizard's nav bar.
4. Coverage: all Setup Wizards (incl. ActivityListWizard — currently a
   phantom in the Drafts tab map — UniversalList, RoutineBuilder, StarChart,
   GetToKnow, MeetingSetup) + SequentialCreatorModal + TaskCreationModal
   full-mode (routine building loses the most work today). Drafts tab reads
   the table (badge count, resume by draftId, cross-device).
PROOF (rider a): Playwright pin — start a wizard on desktop viewport, type
state, close via X → assert wizard_drafts ROW (not localStorage); reopen →
continue restores state; start-fresh preserves both; discard deletes; resume
a draft, DEPLOY it fully and assert the created primitive rows + draft
cleanup. tsc -b; tour re-run.
```

### ST-D — Studio Intelligence Phase 2

```
⚙ STEP 1 (type this first): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest.

You are the ST-D worker for STUDIO-EXPERIENCE: the intelligence layer Studio
was designed for. READ FIRST: claude/feature-decisions/Studio-Experience.md
F-07/F-08/F-19 + §4.1 Bucket 1; STUB_REGISTRY "Studio Intelligence Stubs";
prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md
§1D (tag vocabulary); universal rules in the active build file.

SCOPE:
1. Search v2: matchesSearch includes capability_tags; ALL sections filtered
   (Trackers & Widgets, Gamification, Growth are unfiltered today) and
   noSearchResults accounts for them; NLC stays visible during search.
2. Use-case browse + "Best for:" tag pills on cards (Studio card spec in
   specs/studio-seed-templates.md — description/example_use_cases stay the
   copy source).
3. My Library unified tab: task_templates + list_templates + wizard_templates
   + reward_list lists (F-19: mom's deployed Rewards Lists must be visible +
   editable SOMEWHERE — this is it) with type badges and the existing
   sort/filter.
4. Conv-250 reopen-editable: wizard_templates rows re-open their wizard
   pre-populated (read-side for the 3 writers; add the write for wizards that
   don't record one — RewardsList, ActivityList, UniversalList, StarChart,
   GetToKnow, MeetingSetup deployments); Customized items stay editable.
5. Post-creation recommendations: after any deploy, a small "next best step"
   card computed from capability_tags adjacency (data-driven, no AI call).
6. Tracker-section findability handoff to ST-E noted (grouping lands there).
PROOF (rider a): Playwright pin — search 'potty' surfaces the tag-matched
tiles across sections; deploy a Rewards List then find + reopen + EDIT it via
My Library and assert the list_items change persisted; reopen a wizard_templates
deployment pre-populated and redeploy, asserting new rows. tsc -b; tour re-run.
```

### ST-E — Tracker shelf & pickers

```
⚙ STEP 1 (type this first): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest.

You are the ST-E worker for STUDIO-EXPERIENCE: one honest, navigable tracker
shelf. READ FIRST: claude/feature-decisions/Studio-Experience.md F-10/F-17 +
tracker-tiles section + B8; STUB_REGISTRY lines ~483-503; universal rules in
the active build file.

SCOPE:
1. Canonical category scheme (founder-explicit): pick ONE — recommendation:
   keep WidgetPicker's 8 snake_case keys as canonical, add a display-label
   map, and MIGRATE widget_starter_configs.category values (migration per
   protocol; 100032/100056 rows currently carry human labels, 100063 already
   uses goal_pursuit). Add a vitest that loads the live/seed category values
   and fails on any value outside the canonical key set (founder-explicit
   "test that fails on any future mismatch").
2. color_reveal + gameboard: build-or-pull (founder default BUILD — but these
   are renderer-scale features; propose scope in your first message: if
   building real renderers exceeds the slice, PULL them from WidgetPicker's
   trackerTypes so no "Coming soon" trap remains, and register the build as
   its own follow-up — founder decides on your proposal).
3. Reward Spinner: create a randomizer_spinner starter config seed so the
   Studio tile + picker land on a real spinner config (fixes the BROKEN tile
   with ST-A's interim note removed).
4. Shelf UX: group the 39 tracker tiles by canonical category with headers
   inside the section (no more one 39-card scroll row); dedupe/rename the
   colliding names (Countdown ×2, Reading Log ×2).
5. Honesty: "Prize at Goal"/"Prize at End" fields get a visible caveat ("Saved
   with the chart — automatic awarding arrives with tracker goals; you can
   award it from PrizeBoard meanwhile" — founder-approvable copy) until P4
   ships firing; deploy default-assignee UX: WidgetConfiguration preselects
   the member the flow implies (from gamification picker / wizard context)
   and requires an explicit member confirm instead of silently defaulting to
   mom (B8).
PROOF (rider a): Playwright pin — deploy a tracker from a Studio tile to
CASEY and assert the dashboard_widgets row (family_member_id=Casey) AND that
it renders on Casey's dashboard (scroll the lazy grid); WidgetPicker shows
starter configs under every canonical category (assert ≥1 config per seeded
category); the mismatch vitest green. tsc -b; tour re-run.
```

### ST-G — Bulk-add + integration closeout

```
⚙ STEP 1 (type this first): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest.

You are the ST-G worker for STUDIO-EXPERIENCE: the integration items that make
the surface feel finished. READ FIRST: claude/feature-decisions/
Studio-Experience.md F-16/F-18/F-11 + §4.1 bulk-add classification; universal
rules in the active build file.

SCOPE:
1. Bulk-add unification: ListRevealAssignmentWizard's bespoke bulk parse
   migrates onto the shared BulkAddWithAI (keep its per-flavor field
   inference); AI-suggest for RepeatedActionChartWizard milestones (propose
   milestone ladder from chart name/target). RewardsList bulk-add landed in
   ST-A — verify still green.
2. F-18: template deploy reachable from the Lists page — [+ New List] picker
   gains a "Start from a template" row listing system + family list_templates
   (incl. mom's "Make Reusable" saves) that routes through the existing
   hydration path.
3. Activity-list scheduling wiring (founder-explicit): ActivityListWizard
   exposes the Universal Scheduler (PRD-35 component) writing
   lists.schedule_config; deployed activity surfaces honor active-day state
   (reuse the painted/recurring badge machinery from Worker 5's lists work).
4. F-11: Studio.tsx todayStr → family-today derivation (fetchFamilyToday
   pattern per Convention #257(b)).
5. Sweep of small honesty items left: gamification member-picker excludes
   Special Adults by default (offer behind "show everyone"); Drafts tab
   Discard uses ModalV2 confirm (if ST-C hasn't already replaced it).
PROOF (rider a): Playwright pins — bulk-paste 6 items into the ListReveal
wizard via the SHARED component and deploy, asserting list_items; deploy a
list template from the Lists page path asserting hydrated items + template_id;
configure an activity-list schedule and assert schedule_config + the
active-today badge state. tsc -b; tour re-run; full findings table
(F-01…F-22) statused Wired/Stubbed/Missing in the active build file
(Checkpoint 5 for the whole cleanup).
```

## Retroactive verification (founder ruling)
The graded 89-tile matrix + Pass B/scenario evidence in the evidence record §2–§3 constitutes the retroactive Post-Build Verification for Phase 3.7 and Phase 3.8 (their feature-decision files' tables were never filled). Copy at close-out.

## Mom-UI Verification

*(Convention #277 Claude-driven visual pass — Claude toured the flow, read the screenshots, recorded verdicts. Screenshot set: `<scratchpad>/studio-audit/s-m77-*.png` + `TOUR-*` records in scenarios.ndjson.)*

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Progress Chart wizard steps 1-6 (post ST-0 + F-23 micro-fix) | ✅ 1440px — all 6 steps render, step dots, prefill, Casey pill selectable | — (not toured; modal is width-fluid between the two verified extremes) | ✅ 375px — bottom-sheet modal, steps/inputs/nav reachable, no clipping | Mom | s-m77-desktop-1…6, s-m77-mobile-1…6 (read by Claude) | 2026-07-04 |
| **Success screen ("Chart deployed!")** — first time reachable in production | ✅ star icon + "STUDIOAUD Tour Chart is active…" + Done | — | ✅ same at 375px | Mom | s-m77-desktop-7-SUCCESS, s-m77-mobile-7-SUCCESS + TOUR-*-success-screen text records | 2026-07-04 |
| Deployed chart on kid surfaces | ✅ Casey dashboard: both star-chart widgets (0/20, star rows) render in Trackers & Widgets; both action tasks at top | — | — | Independent (Casey) | s-m77-casey-dashboard, s-m77-casey-tasks + TOUR-casey-render {widgetVisible:true, taskVisible:true} | 2026-07-04 |

Visual-pass notes fed back into slices: (1) mobile Assign pill needed a verified-select retry in the tour — watch real-mom tap reliability on 375px pills (ST-A eyes); (2) the Assign step says "Each child gets their own independent chart" while offering Everyone/Mark/Amy/Kylie (adults + Special Adults) as pills — same member-classification smell as S1/B8; fold into ST-A item 9 / ST-E default-assignee work.

## Post-Build Verification
*(Checkpoint 5 of the cleanup build — every finding F-01…F-21 + Bucket-1 item: Wired / Stubbed / Missing. Zero Missing required.)*
