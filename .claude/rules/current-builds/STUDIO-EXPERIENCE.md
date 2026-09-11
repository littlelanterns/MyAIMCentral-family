# Active Build: STUDIO-EXPERIENCE — Studio Surface Audit + Cleanup

> **Status: ST-A + ST-F + ST-B CODE COMPLETE — HOLDING for founder review + commit approval. NOTHING COMMITTED.** ST-A: 14/14 E2E + 25 vitest + 8/8 relevant regressions, 2026-08-23 (see "## ST-A — Shelf truth" below; migrations 100317+100318 applied). ST-F: 16/16 E2E (14 ST-A pins + 2 new, full serial file green twice) + 14/14 constraint vitest, 2026-08-23 (see "## ST-F — Reward-wire truth" below; migrations 100319+100320 applied + ledger-repaired). **ST-B (2026-09-07): local proof green (tsc/eslint/prebuild/redteam all clean; the new router vitest — 29/29 — RAN LIVE against real OpenRouter, a pure external-API call outside the production-touch gate's enumerated list). A seat referee pass caught and this session fixed a real stale-closure bug on the high-confidence auto-open path (Probe 4's exact path would have opened `RoutineBuilderWizard` with an empty description on a fresh session — see the "Seat referee finding" note in the ST-B section) — re-verified clean after the fix. **ST-B PROOF COMPLETE (2026-09-11) — holding for referee + founder commit. NOTHING COMMITTED.** All three seat-granted suites green: `nlc-composition` **5/5 (run twice back-to-back)**, `studio-shelf-truth` **16/16**, Studio audit tour **1/1 (89 tiles, zero console errors)**, plus a new ST-B eyes-on tour **2/2 (14 shots, all read, zero console errors)**. The slot surfaced **eight real defects, every one fixed in code with no assertion ever touched**: three router defects (no `temperature`, no naming guidance, no `actionTaskName` guidance — each verified deterministic 5/5 or 3/3 before asking for a redeploy), one mom-facing copy defect found by READING a screenshot (router meta-commentary leaking into the restate sentence mom sees), three spec-traversal defects (a step off-by-one, a wrong assumption about the Items-step UI, and a 3s-vs-9s race in the confidence-card helper that made a real card sit unclicked), and one orphaned-row leak in an ST-A test file that had silently accumulated 30 rows since August (25 pre-dating this session; seat swept them). Residue after two consecutive 5/5 runs: **0 on both the time-window and fixture-name queries across all five tables.** No migration needed (zero schema changes). See "## ST-B — NLC v2" below.
> Previous: ST-0 + F-23 MICRO-FIX COMPLETE, VISUALLY VERIFIED, COMMITTED `9676734` (2026-07-04).
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

## ST-A — Shelf truth (worker session 2026-08-23) — CODE COMPLETE, PINS GREEN, HOLDING FOR FOUNDER

**Proof:** `tests/e2e/features/studio-shelf-truth.spec.ts` **14/14** (real deploys, DB-asserted via service role, STUDIOAUD fixtures swept to zero — verified by a whole-DB residue query; the single `lists` hit was the founder's own real April "Consequences" list in OurFamily, untouched). `tests/studio-shelf-truth-units.test.ts` 12/12 + `tests/task-source-constraint.test.ts` 13/13. Regressions on touched surfaces: `progress-chart-deploy.spec.ts` + `studio-setup-wizards.spec.ts` + `studio-intelligence-phase1.spec.ts` → 8/8 relevant green (1 PRE-EXISTING stale failure, see flags). `npx tsc -b` clean; eslint 0 errors on all touched files.

**Migrations taken (both applied to production via `supabase db query --linked -f` — foreign unapplied migrations 100314–100316 belong to other live lanes — then `migration repair --status applied`):**
- `00000000100317_seed_tsg_extra_jobs_randomizer_template.sql` — the TSG list_templates system row (13 items) the tile always promised (F-04d). Live-verified: 13 default_items.
- `00000000100318_guided_form_responses_spec_columns.sql` — brings guided_form_responses (0 rows since birth) to the FOUNDER-SPEC column shape: rename `response_content`→`section_content`, add `filled_by`/`completed_at`/`lila_enabled`. Live-verified. Run `npm run schema:dump` at commit time.

### Item-by-item verification

| ST-A item | Status | Evidence |
|---|---|---|
| 1. F-03 Duplicate rewrite (deep-copy, real task_type, error toast, no reload) + Archive ModalV2 confirm + all 3 `window.location.reload()` sites removed | **Wired** | E2E test 1 (config/reward deep-copy asserted); Studio.tsx archive confirm modal + invalidateQueries |
| 2a. Extra House Jobs Board example → prefilled BOARD flow (10 items: 8 money $1–$3 + 2 connection 5-pt) | **Wired** | `EXTRA_HOUSE_JOBS_PREFILL` in ListRevealAssignmentWizard; E2E test 2 deploys + asserts 10 items/8 money/2 points |
| 2b. Curriculum Chapter Sequence → SequentialCreatorModal with 5 chapters | **Wired** | New `initialTitle`/`initialItems` props on SequentialCreator(Modal); E2E test 5 (collection + 5 child tasks to Jordan) |
| 2c. Guided-form example prefills (SODAS Situation / What-If Scenario / Apology intro note) | **Wired** | New `initialMomValues` prop on GuidedFormAssignModal + `GUIDED_FORM_EXAMPLE_PREFILLS`; E2E test 6 asserts the persisted mom row content |
| 2d. TSG Extra Jobs Randomizer data source | **Wired** | Migration 100317; E2E test 7 (13 items hydrate: 9 one-time + 4 repeatable) |
| 3. F-05 Opportunity Board blank tile → board creation | **Wired** | handleCustomize opportunity branch → ListReveal opportunity flavor; E2E test 4 (lists row is_opportunity, zero orphan task = B6 counter-proof) |
| 4. F-06 Best Intentions Starter wizard | **Wired** | New `BestIntentionsStarterWizard.tsx` (2 steps, 4 category suggestion groups + custom entry, success screen); E2E test 8 (rows with source='studio_wizard') |
| 5. F-13 Use as-is honest | **Wired (design note)** | Real fast-deploy paths: routines→RoutineDeployModal; potty chart→wizard at Assign; consequence spinner→wizard at Review (one-tap deploy); earning boards→wizard at Sharing; honey-do→wizard at Share. New `supportsUseAsIs` flag on StudioTemplate — the button now renders ONLY on the 7 examples with a genuine fast path; examples whose Customize surface already IS the minimal deploy surface (guided forms, list templates, sequential, TSG, shared-shopping, activity seeds) no longer show a duplicate button. E2E test 9 (spinner deploys straight from Review; Morning Routine opens "Deploy:" modal) + test 14 |
| 6. F-16 RewardsListWizard shared BulkAddWithAI | **Wired** | Shared component with small/medium/big tier categories; E2E test 10 (panel present + real deploy) |
| 7. F-22 UniversalListWizard deploy repair | **Wired** | Resumable deploy (created-list ref — retry finishes the SAME list, no duplicates), single atomic batch item insert, preset quantities parsed into quantity/quantity_unit (were silently dropped), sharing step gates "specific with nobody picked", VISIBLE auto-suggested name at Review (never a silent tile-label title), deploy errors surfaced in-wizard naming the failed phase. E2E test 12 (10/10 preset items + Milk 1 gallon + Mark's share + is_shared) |
| 8. Rider (b) board scoping | **Wired** | ListReveal audience = kids-only via shared `isChildMember()` (Special Adults NEVER appear, not even behind the "Show adults too" opt-in which offers only mom/dad); "All kids" copy; deploy writes `eligible_members` (the useOpportunityLists enforcement field) + kid-scoped shares. E2E test 2 (pill absence + eligible_members=[Alex]) + test 3 leak probe (Alex sees / Casey doesn't / Amy the Special Adult doesn't, browser sessions + DB) |
| 9. F-20 shared isChildMember + empty state + seed relationships | **Wired** | `src/lib/members/isChildMember.ts` (relationship-first + role/dashboard_mode fallback; SA hard-excluded); MeetingSetupWizard consumes it + visible no-kids notice; RepeatedActionChartWizard Assign pills kid-scoped (2026-07-04 visual-pass note); seed-testworths MEMBERS carry relationship values. E2E test 11 (NULL-relationship Jordan keeps kid steps, restored in finally) + vitest 12/12 |
| 10. Card-copy truth: Reward Spinner + NLC restate + memberName prefill | **Wired** | Spinner tile → synthetic in-memory randomizer_spinner starter config → real WidgetConfiguration → deploys a real spinner widget (E2E test 13; ST-E's DB seed will take over via the normal path). NLC: prompt rewritten to second-person verb phrase + exported `normalizeRestate()` client guard (vitest) + low-confidence copy reads "you want to …". `memberName` → resolved to a member id (display name/first name/nicknames) → chart Assign preselect |
| 11. F-23 remainder (ListReveal :949 + SharedTaskList :388 wizard_templates writers) | **Wired** | Both now insert the real column shape (`template_type`/`title`/`template_source:'family'`/`original_author_id`) in ISOLATED try/catch; SharedTaskListWizard additionally gained a success screen + in-wizard deploy-error surfacing (its old `template_source:'wizard'` CHECK violation threw inside the main try — the wizard could never finish cleanly). E2E test 2 + test 14 assert the provenance rows + success screens |

### Adjacent dead-write-paths discovered by the pins (fixed, founder should know)

1. **Studio guided-form assignment had NEVER worked** — three independent kills: (a) Studio passes a synthetic template (`id:'studio_sodas'`) that was written into `tasks.template_id` (UUID FK → 22P02 on every assign); (b) `guided_form_responses` writers used the founder-spec columns (`section_content`/`filled_by`) that migration 000024 never created (it created `response_content`/`response_metadata` instead) — 0 rows ever; (c) every writer omitted the NOT-NULL `family_id`, and FillView's upserts targeted a non-existent unique (`task_id,section_key` vs the real `task_id,family_member_id,section_key`). Fixes: migration 100318 (spec columns; table had 0 rows so the rename is safe), GFAM guards non-UUID template ids to null + inserts only MOM'S sections with family_id (RLS `gfr_insert_own` scopes inserts to the authoring member — child rows are created by the child's own fill flow, and readers already treat absent rows as blank), FillView writes fixed mechanically. The child fill surface (GuidedFormCard/FillView) remains UNMOUNTED — pre-existing known issue, not ST-A scope; the per-assignment LiLa-help flag now has no persistence home until that mounts (noted, rides with the fill-surface work).
2. **`studio-intelligence-phase1.spec.ts` test 1C is STALE** (pre-existing, not an ST-A regression — zero ST-A diff on Tasks.tsx or the spec): it asserts the Tasks → Sequential tab that FO-COMMAND-CENTER retired in June (Conventions #150/#275). Left untouched — it's another build's pin; the seat should have it re-pointed at the Family Overview spot-check Sequential tab. Its tests 1A/1B/1C-lists (the ones exercising ST-A's touched SequentialCreatorModal) pass.

### Step 0 note (Convention #241)
Grep/Glob-only session per the standing PRD-30/PRD-40 audit precedent (codegraph/AURI state not re-verified; override recorded here for founder acknowledgment).

### Files touched (selective-staging list — verified against `git status` at session end)
`src/pages/Studio.tsx` · `src/components/studio/StudioTemplateCard.tsx` · `src/components/studio/studio-seed-data.ts` (supportsUseAsIs flags only — no card copy touched) · `src/components/studio/NaturalLanguageComposition.tsx` · `src/components/studio/wizards/{ListRevealAssignmentWizard,UniversalListWizard,SharedTaskListWizard,RewardsListWizard,RepeatedActionChartWizard,MeetingSetupWizard,BestIntentionsStarterWizard}.tsx` · `src/components/guided-forms/{GuidedFormAssignModal,GuidedFormFillView}.tsx` · `src/components/tasks/sequential/{SequentialCreator,SequentialCreatorModal}.tsx` · `src/lib/members/` (new — isChildMember.ts) · `supabase/migrations/{00000000100317,00000000100318}*.sql` · `tests/e2e/features/studio-shelf-truth.spec.ts` (new) · `tests/e2e/features/studio-shelf-truth-eyes-on-tour.spec.ts` (new, EYES_ON_TOUR-gated) · `tests/studio-shelf-truth-units.test.ts` (new) · `tests/e2e/helpers/seed-testworths-complete.ts` · this file

**DO NOT STAGE (PRD-40 Slice 3 lane, in flight uncommitted in the same tree):** `.claude/rules/current-builds/PRD-40-coppa.md` · `RLS-VERIFICATION.md` · `src/hooks/useFamilyMember.ts` · `src/pages/{FamilyMembers,FamilySetup}.tsx` · `src/components/coppa/` · `src/lib/coppa/` · `supabase/migrations/00000000100315*.sql` · `tests/e2e/features/coppa-consent-*.spec.ts` · `claude/web-sync/Competitive-Feature-Synthesis-2026-07-11.md`. (PRD-31 Slice 1 + migrations 100314/100316 were committed by their own lanes mid-session at 18:01 — `090a751`/`668833e`.) At commit time, also run `npm run schema:dump` (migrations 100317+100318 are applied to production).

## ST-F — Reward-wire truth (worker session 2026-08-23) — CODE COMPLETE, PINS GREEN, HOLDING FOR FOUNDER

**Decision (Option 2, not Option 1):** stop authoring the wizards' dead `source_type IN ('list_item_completion','randomizer_drawn')` contracts entirely, rather than building new deed producers for those types. Investigation confirmed the ACTUAL payment paths for every reward type the wizards promise already exist, are already proven, and are completely independent of the wizard's own contracts:

| Reward | Real payment path | Wizard's dead contract (removed) |
|---|---|---|
| Opportunity money | `task_rewards` (snapshotted from `list_items` at claim) + `grant_money_for_task_completion` | `money_godmother` on `list_item_completion` |
| Opportunity points | `tasks.points_override` + the standing per-family `points_godmother` contract, fired on the ordinary `task_completion` deed | `points_godmother` on `list_item_completion` |
| Opportunity privilege/custom | `task_rewards` + `award_custom_reward_for_completion` | `custom_reward_godmother` on `list_item_completion` |
| Draw-flavor task creation | `Randomizer.tsx`'s `handleAssign` — generic to every randomizer list, independent of the wizard | `assign_task_godmother` on `randomizer_drawn` |
| ActivityListWizard gamification (segment-tile target) | Standing per-kid `creature_godmother`/`page_unlock_godmother` contracts (migration 100225) + points config-as-truth, fired on the ordinary `task_completion` deed | `allowance_godmother`/`points_godmother`/`creature_godmother`/`page_unlock_godmother` on `list_item_completion` |

ActivityListWizard's "every Nth completion" threshold bonus and daily-floor allowance registration have NO existing producer (nothing counts recurring list-item completions toward a threshold or floor today) — building that is genuinely new counting infrastructure, out of a rewire slice's scope, handed off the same way tracker-goal→prize firing was (Bucket 2/P4). The Rewards step now says so honestly instead of promising a bonus that never paid (mirrors ST-E's established "Prize at Goal" label-honesty precedent).

**Two P0-class bugs found live while proving this out (both fixed, both block the exact scenario the dispatch prompt's PROOF section asks for):**

1. **`useTaskCompletion.ts` (the TaskCard checkbox path — used almost everywhere, not opportunity-specific) never gated `require_approval` at all.** It always set `tasks.status='completed'` and never wrote `task_completions.approval_status`, so `useTasksWithPendingApprovals` (which filters `tasks.status='pending_approval'`) never surfaced these completions — mom's Family Overview Approvals queue was permanently empty for anything completed via TaskCard with `require_approval=true`, meaning it could NEVER be approved, meaning approval-gated money/prizes could never pay. Fixed to mirror `useCompleteTask`'s (hooks/useTasks.ts) already-correct branch exactly: `status: requireApproval ? 'pending_approval' : 'completed'`, `approval_status: requireApproval ? 'pending' : null`. Also gated the `fireDeed`/`grantMoneyForTaskCompletion`/`awardCustomRewardForCompletion` calls on `!requireApproval` (Convention #201 — "mom full control over when rewards actually flow to kids" — this file fired gamification/rewards on submission, before approval, which the sibling hook never does).
2. **`Randomizer.tsx`'s `handleAssign` — the only draw→task producer in the whole platform, used by every randomizer list regardless of how it was created — has ALWAYS inserted `tasks.source='randomizer_draw'`, a value that has NEVER existed in `tasks_source_check`.** Same bug class as F-21/ST-0 ('studio'/'wizard'). Every draw-and-assign has thrown a 23514 violation since the component shipped; the type union separately (and also uselessly) declares `'randomizer_reveal'`, a value nothing ever writes. Migration 100320 adds `'randomizer_draw'` to the constraint (rebuilt from the current full enumeration per the ST-0 precedent, re-verified live immediately before writing); `src/types/tasks.ts`'s `TaskSource` union updated to match; `tests/task-source-constraint.test.ts`'s `KNOWN_TASK_SOURCE_WRITERS` extended (14/14 green).

Also fixed the SAME class of dead-field bug directly adjacent to what I was testing: the wizard's own "Approval required for payout" checkbox (`state.approvalRequired`, defaults checked) was never written anywhere — `listPayload` never set `default_require_approval`, and `useOpportunityLists.ts`'s claim insert never read it into the bridge task's `require_approval`. `lists.default_require_approval` already exists and already has a live mom-facing toggle on the Lists page detail settings (Convention/UI predates this build) — so this wasn't wizard-only either; it was a platform-wide silent no-op for ANY board with that toggle on, wizard-deployed or not. Both sides now wired.

**Card-copy honesty pass** (`studio-seed-data.ts`): "Extra Earning or Consequence Spinner" and "Extra Earning Opportunities" both claimed contracts fired "automatic reward delivery" — rewritten to describe the real (now-true) payout behavior.

**Reveal-attachment wiring (draw flavor) — closed a second, fully-separate gap the same way.** The reveal animation mom picks in the wizard used to be written only into the dead contract's `presentation_config`, never read by anything. The REAL reveal pipeline (`RewardRevealProvider` mounted in every shell, `useRevealOnCompletion`/`checkAndQueueReveal`, `reward_reveal_attachments` table + mutations) was fully built platform-wide but had **zero callers anywhere in the codebase** — confirmed by exhaustive grep before touching anything. Wired end-to-end: the wizard now creates a real `reward_reveal_attachments` row (`source_type='list'`) at deploy (creating a backing `reward_reveals` row for the inline celebration-only picker, since this picker never lets mom set prize text — `prize_type='celebration_only'` is the honest mapping, which `RewardRevealProvider` already special-cases to skip an `earned_prizes` write), and `Randomizer.tsx`'s `handleAssign` now calls `checkAndQueueReveal` after a successful draw-assign — proven live: the modal's `onRevealed` fired and `times_revealed` incremented within the RPC's own ~2s auto-show timer, no manual dismiss needed.

**Deliberately NOT touched (residual findings, flagged for a future slice, not silently dropped):**
- `personPickMode`/`kidCanSkip` on the draw flavor are UI-only configuration for behavior `Randomizer.tsx` doesn't implement (no "who picks first" concept, no "kid can skip" concept) — cosmetic before this fix (the dead contract was their only would-be destination), still cosmetic after. Genuinely a DRAW-UX gap, not a reward-wiring one; flagged for ST-B/ST-D.
- ActivityListWizard's per-item `ListItemDraft`-adjacent state is untouched beyond removing the two dead contracts — no attempt to invent threshold-counting infrastructure (see decision table above).
- No Convention #277 formal eyes-on tour spec was authored for ST-F specifically — proof is the 16-test E2E suite (which drives the real UI end-to-end, screenshots captured incidentally during debugging and read directly — see below) rather than a dedicated tour-and-screenshot-read pass across viewports. Flagged for the seat: worth a short follow-up tour before/at founder sign-off if a formal Mom-UI row set is wanted beyond what's below.

### Migrations (both applied to production + ledger-repaired)
- `00000000100319_st_f_archive_dead_wizard_contracts.sql` — archives existing dead wizard-authored contracts (`status='archived'`). Live-verified: 19 `opportunity_wizard` rows archived (0 `draw_wizard`/`activity_list` existed). Deliberately conservative scope: ActivityListWizard's `rewardScope='combined'` contracts (which have `source_category=NULL`, indistinguishable from a mom-authored `/contracts` rule) are left untouched by the migration — the code fix prevents any new ones; flagged as a residual for manual founder review if desired, not silently left broken by omission.
- `00000000100320_st_f_randomizer_draw_source_value.sql` — adds `'randomizer_draw'` to `tasks_source_check` (P0 fix #2 above). Authored with the same `source IN (...)` shape as migration 100283 so the existing constraint-guard vitest parses it as the current definition.

### Proof
`tests/e2e/features/studio-shelf-truth.spec.ts` — **16/16 green** (the 14 ST-A pins + 2 new ST-F tests), run standalone and as the full serial file, twice, with zero DB residue confirmed independently after (lists/tasks/dead-contracts/reward_reveal_attachments/financial_transactions all 0). `tests/task-source-constraint.test.ts` — 14/14 (12 pre-existing + `randomizer_draw` writer + allowed-list membership). `npx tsc -b` clean. `npx eslint` on all touched files — 0 errors, 2 pre-existing unrelated warnings (confirmed pre-dating this session's diff). New tests: "ST-F: approval-required money item pays exactly once, only after mom approves" (deploys its own board via the wizard — self-contained, no dependency on ST-A's test-ordering — claims+completes as Alex through the real TaskCompletionExpander "Submit for Approval" flow, asserts ZERO `financial_transactions` rows exist pre-approval, approves as mom via the real Family Overview Approvals tab, asserts EXACTLY ONE `financial_transactions` row post-approval matching the item's reward amount, and asserts zero active dead contracts); "ST-F: draw-flavor reveal attaches for real and fires when a kid draws + assigns" (deploys a spinner via the wizard including the Reveal step, asserts a real `reward_reveal_attachments`+`reward_reveals` row pair, draws+assigns to Alex from the real Lists page UI, asserts a real `tasks` row lands with the right assignee, asserts `times_revealed` increments without manual interaction, and asserts Alex's own Tasks page renders the drawn task).

**Debugging note for the record (not itself a finding, but explains several fixes above):** three of my own test-locator assumptions were wrong on the first pass and were corrected against ACTUAL rendered UI (captured via ad-hoc screenshots during debugging, then removed once the flow was confirmed correct): (a) an approval-required item opens `TaskCompletionExpander`'s "Submit for Approval" step, not an immediate completion, on the SAME "Mark complete" click; (b) the claimed board item's card in the Opportunities tab's board-browse view is claim-STATUS-only (no completion affordance) — the actual completable TaskCard lives on "My Tasks" with the Opportunities inclusion pill toggled on; (c) `task_completions.approval_status` has no DB default and starts NULL, not the string `'pending'` (the RPCs read it via `COALESCE(approval_status, 'pending')`, but a raw poll must check `!== 'approved'`, not `=== 'pending'`). None of these were flakiness — each pointed at a real thing to understand about the app, and (a)/(c) directly led to finding bug #1 above.

### Files touched (selective-staging list)
`src/components/studio/wizards/ListRevealAssignmentWizard.tsx` · `src/components/studio/wizards/ActivityListWizard.tsx` · `src/components/lists/Randomizer.tsx` · `src/hooks/useTasks.ts` · `src/hooks/useTaskCompletions.ts` · `src/hooks/useOpportunityLists.ts` · `src/components/tasks/useTaskCompletion.ts` · `src/types/tasks.ts` · `src/components/studio/studio-seed-data.ts` (2 description strings only) · `supabase/migrations/{00000000100319,00000000100320}*.sql` · `tests/e2e/features/studio-shelf-truth.spec.ts` (2 new tests + `pollDb`/`waitForAppReadyFast` helpers + sweep extended for reward-reveal/financial-transaction/source-referenced-task cleanup) · `tests/task-source-constraint.test.ts` (1 new writer entry) · this file

At commit time: `npm run schema:dump` (migrations 100319+100320 change `contracts`/`tasks` constraint state, not columns, so a schema-dump diff will be minimal/none — run it anyway for hygiene). Same DO-NOT-STAGE list as ST-A's note above still applies for any files from concurrent lanes still present in the tree at commit time — re-check `git status` fresh, don't rely on the ST-A snapshot.

## ST-B — NLC v2 (worker session 2026-09-07) — CODE COMPLETE, HOLDING for a seat-granted E2E slot

**Freshness preamble:** `git log --oneline --since=2026-08-23` confirmed ST-A (`88993b0`) and ST-F (`8b4c5c1`) are on `main`; tree clean at session start; next-free migration number 100333 (not needed — this slice added zero schema). `git status --porcelain` confirmed an empty tree throughout, no concurrent lanes active.

**What shipped:**

1. **`supabase/functions/nlc-compose/index.ts`** — a dedicated Edge Function replacing the client's direct `ai-parse` call. Full SAFETY-BETA-GATE scaffold copied from `recipe-extract` (the seat-designated reference, NOT `curriculum-parse` which has no `detectCrisis`): `authenticateRequest`, `detectCrisis` on the free-text input, `buildSafetyPreamble` on the system prompt, `callOpenRouter`/`withNoTraining` from the shared no-training client, `scanUtilityInput`/`scanUtilityOutput`/`enqueueOutputScan` (PRD-41 Tier-0, optional — skipped when `family_id`/`member_id` aren't supplied, matching `recipe-extract`'s own optionality), `logAICost`, and `extractJsonObject` from `_shared/json-extract.ts` for tolerant JSON parsing (never the bare fence-strip regex the F-01 finding's own predecessor bug class came from). `verify_jwt = false` + a `[functions.nlc-compose]` config.toml entry added in the same commit (the JWT config guard — `node scripts/check-function-jwt-config.cjs` — passes, 64/64 functions covered).
2. **`supabase/functions/_shared/nlc-router-prompt.ts`** — the full 15-outcome catalog + system prompt extracted to a zero-import module (mirrors `json-extract.ts`/`crisis-detection.ts`), so the Edge Function AND its live-model vitest pin import the SAME prompt and can never silently drift onto two different prompts (the exact discipline that motivated `_shared/json-extract.ts`'s own creation). The 15 outcomes: the original 6 (`rewards_list`, `repeated_action_chart`, `list_reveal_assignment_opportunity`, `list_reveal_assignment_draw`, `activity_list_wizard`, `shared_task_list_wizard`) plus the dispatch's required 8 (`universal_list`, `routine_builder`, `sequential_creator`, `star_chart`, `meeting_setup`, `get_to_know`, `gamification_setup`, `task_quick_create`) plus `none_confident` as a first-class outcome (never a hard failure).
3. **`src/components/studio/NaturalLanguageComposition.tsx`** rebuilt on `supabase.functions.invoke('nlc-compose', ...)` (the `recipe-extract`/`RecipeCaptureModal.tsx` client-caller pattern — auth handled automatically). Handles `data.crisis` (Convention #7 display, takes priority over everything else), `data.error` (§2.9 fallback: full 14-wizard catalog, never "I don't understand"), and the `none_confident` outcome (always falls through to the full-catalog card regardless of the reported confidence — a `high`-confidence `none_confident` would otherwise auto-open nothing). `ALL_WIZARD_TYPES` now lists all 14 real wizards (was 6) for both the error-fallback chips and the low-confidence list. Visible even while Studio's search box has text (F-07 — the `{!searchQuery.trim() && (...)}` gate around the component was removed in `Studio.tsx`).
4. **`finalizePreFill()` — the routine_builder verbatim-description guarantee.** Live-testing the router against the four probe phrases (see below) found a real gap: the model doesn't reliably echo the `description` field back for `routine_builder` even though the prompt explicitly asks for mom's original wording verbatim (the "morning routine" probe returned `{routineName:"morning routine"}` with NO `description` key at all). Rather than fight the model's compliance, `finalizePreFill()` always overrides `description` with `lastSubmittedText` (captured at submit time, survives into the confirmation card's later button clicks) whenever the target wizard is `routine_builder` — guaranteed verbatim by construction, not by prompt compliance. Applied at all four `onOpenWizard` call sites (high-confidence auto-open, error-fallback catalog, medium-confidence confirm, low-confidence catalog pick).
5. **Prefill plumbing added to 4 wizards that previously had none** (Convention 255 Q9 / Composition doc §2.9's "every wizard accepts a prefilled entry state"). All four are conditionally mounted by `Studio.tsx` (`{xOpen && <Wizard isOpen={xOpen} .../>}`) so a fresh mount happens on every open — no `preFillApplied`-ref restore-on-open dance was needed, just plain lazy `useState(initial ?? default)` initializers (StarChartWizard, GetToKnowWizard) or a mount-only `useEffect([])` guarded by the same "don't stomp a restored draft" pattern `UniversalListWizard`'s own `initialPreset` effect already used:
   - **`StarChartWizard`**: `initialChartName?`, `initialMemberIds?`.
   - **`GetToKnowWizard`**: `initialMemberId?` (also skips step 0 "Pick a Person" straight to the first category when set).
   - **`RoutineBuilderWizard`**: `initialRoutineName?`, `initialDescription?`, plus `familyId?`/`ownerId?` (new — required only for the S3 linked-randomizer feature below; degrades gracefully to a normal static step when absent, never crashes).
   - **`UniversalListWizard`**: `initialTitle?`, `initialItems?: string[]`, `initialListType?`, `initialSharingMode?`, `initialSharedMemberIds?` — extends the existing `initialPreset` mount effect with an `else if` branch (same `!state.detectedListType` restored-draft guard), jumping `setCurrentStep(1)` to skip the Purpose step since the router already decided the list type.
6. **`resolveMemberIdByName()`** — a shared helper in `Studio.tsx` (extracted from the pre-existing ST-A `repeated_action_chart` inline logic, now reused by `star_chart`, `get_to_know`, `gamification_setup`, `task_quick_create`). Case-insensitive full-name/first-name/nickname match against the active roster; returns `undefined` on no match rather than inventing one.
7. **`sharedWithRelationship` → real audience resolution** for `universal_list` ("shared grocery list with my husband"). Reuses `isChildMember`/`isOptInAdult` from `src/lib/members/isChildMember.ts` (the ST-A F-20 classification helper) rather than inventing a second predicate: `'spouse'` → the roster's `additional_adult` (Testworth-verified: Mark, `role='additional_adult'`, `relationship='spouse'`); `'kids'` → every `isChildMember` match; `'everyone'` → `sharingMode='family'`. `listType` is defensively whitelisted against the 8 known-valid values before it ever reaches a DB CHECK-constrained column (a raw, unvalidated model string was never handed straight to `detectedListType`).
8. **`task_quick_create`** wires a new `modalInitialAssigneeId` state in `Studio.tsx` through the ALREADY-EXISTING `initialAssigneeId` prop on `TaskCreationModal` (found via grep — the prop existed, nothing in `Studio.tsx` had ever wired it).
9. **S3 (Composition doc §2.9 composition gap) — "surprise/random step" detection inside `RoutineBuilderWizard`'s OWN internal AI parse** (not the top-level NLC router — a separate, pre-existing `sendAIMessage` call the wizard has always made to turn free text into sections). Rule 8 added to that prompt: a step describing a random/surprise pick gets `"stepType": "linked_randomizer"` + an optional `"randomizerItems"` array. The Review step renders a `Dices`-icon "Surprise pick" badge + an explanatory note. **`handleAccept` became async and is the HITM gate** (Convention #4) — nothing is created during parsing, only proposed; clicking "Use This Routine" is mom's real confirmation, and ONLY THEN does the wizard call `useCreateList()` (`list_type: 'randomizer'`) + a batched `list_items` insert for any enumerated candidate items, then sets that step's `step_type: 'linked_randomizer'` / `linked_source_id: newList.id` / `linked_source_type: 'randomizer_list'` — the exact shape `RoutineSectionEditor.tsx`'s own `LinkedSourcePicker.onSelect` already uses for a manually-linked step, so the resulting step is indistinguishable from one mom linked by hand. A step with `stepType==='linked_randomizer'` but no `familyId`/`ownerId` available degrades to a normal static step (never a crash, never a silently dropped step) — flagged with a disclosed design note below. `isFinishing`/`acceptError` wired into `SetupWizard`'s pre-existing `isFinishing` prop (found via grep — it already existed, unused by this wizard before).

**Disclosed design decision — S3 creates the randomizer list on Accept, before the follow-up `TaskCreationModal` save.** "Use This Routine" is itself a real confirm action (matches the button's own label), so treating it as the HITM gate for the list-creation side effect is consistent with the rest of the wizard's design language. The tradeoff: if mom accepts the routine parse but then abandons the subsequent `TaskCreationModal` without saving, the randomizer list persists unlinked. This mirrors the platform's general pattern of accepting some orphan-risk at a genuine confirm step rather than deferring every side effect to the final possible moment — flagged here rather than silently accepted.

**Live proof — the router itself (ran live, not gated — see below):**

`tests/nlc-router.test.ts` — 29 real mom descriptions (4 required Composition-doc §2.9 probe phrases + 25 more spanning all 15 outcomes) calling OpenRouter directly with the EXACT shared prompt module the deployed function will use. **29/29 passed on the first live run.** Confirmed the four probe phrases now route correctly (all were broken under the old 6-outcome `ai-parse` prompt per F-01):

| Phrase | Old behavior (F-01) | New `wizardType` (live, 2026-09-07) | preFill |
|---|---|---|---|
| "chore board where kids earn money for doing extra jobs" | hard-failed | `list_reveal_assignment_opportunity` (confidence: high) | `{listName:"Chore Board"}` |
| "set up a potty chart for Ruthie" | (already worked) | `repeated_action_chart` (high) | `{chartName:"Potty Chart", actionTaskName:"potty trip", memberName:"Ruthie"}` |
| "a shared grocery list with my husband" | mis-routed to `shared_task_list_wizard` | `universal_list` (high) | `{title:"Grocery List", listType:"shopping", sharedWithRelationship:"spouse"}` |
| "help me set up a morning routine" | mis-routed to Progress Chart | `routine_builder` (high) | `{routineName:"morning routine"}` (no `description` — the gap `finalizePreFill()` closes, see item 4 above) |

**Why the router vitest ran live but the E2E suite did not (the production-touch gate):** `tests/nlc-router.test.ts` calls OpenRouter directly — no Supabase, no deployed Edge Function, no shared dev server, no production-row mutation. None of the gate's enumerated items (migrations, Edge Function deploys, cron scheduling, shared Playwright suites, production-row mutation, invoking a deployed function) apply to a stateless external AI API call, so this ran as ordinary local proof — the same class of action ST-A/ST-F workers already took when authoring and verifying their own prompts. `tests/e2e/features/nlc-composition.spec.ts`, by contrast, drives the real dev server against the real Testworth family in production Supabase — squarely "running a shared Playwright suite," which the gate reserves for a founder-approved, seat-granted slot. It was written, `--list`-parsed clean (5/5 tests), eslint-clean, and code-reviewed against the actual component/wizard source (every locator traced back to a real `value={state.x}`/`data-testid`/computed-style in the source before being written — not guessed), but NOT executed.

**`tests/e2e/features/nlc-composition.spec.ts` — 5 tests, written and parse-verified, NOT run:**
1. Probe 1 (chore board) — full deploy + DB assertion (`is_opportunity=true`), the dispatch's explicit "continue to DEPLOY" requirement.
2. Probe 2 (potty chart) — `chartName`/`actionTaskName` input-value assertions + Ruthie's `[data-testid="member-pill-<id>"]` `data-selected="true"` attribute (a real DOM state attribute, not innerText — `MemberPillSelector.tsx` already stamps this).
3. Probe 3 (shared grocery list) — `Create a List` fallback title (proves it landed on `UniversalListWizard`, not `shared_task_list_wizard`), Mark's pre-selected pill via computed `color: rgb(255,255,255)` (the Sharing step's inline pill implementation has no shared component/testid to key on), title input value on Review.
4. Probe 4 (morning routine) — the EXACT original phrase as the textarea's value (verbatim, per `finalizePreFill()`).
5. S3 — types a "surprise chore pick" step, asserts the "Surprise pick" badge renders, accepts, DB-asserts a real `list_type='randomizer'` row was created, and asserts the step title survives into the `TaskCreationModal` handoff.

All interactive locators are scoped to `page.getByRole('dialog')` (ModalV2's own `role="dialog"`) to avoid any background-page collision on short, reusable button labels like "Next"/"Add item"/"Mark". Cleanup tracks created row ids explicitly (NLC-extracted titles are model-derived English phrases like "Chore Board", not a stable `PREFIX`) plus a title-based safety-net sweep in `beforeAll`/`afterAll`.

**Proof commands run (local only):**
- `npx tsc -b` — clean, zero errors, both before and after every edit.
- `npx eslint` on all 11 touched/new files — 0 errors; the one pre-existing `Studio.tsx:914` `exhaustive-deps` warning reconfirmed unrelated via a `git stash`/re-lint round-trip (identical warning on unmodified `main`).
- `npm run prebuild` — 0 errors / 78 pre-existing warnings (all outside this slice's files); `verify_jwt` 64/64; Safe Harbor filter 64/64, 0 unguarded queries; under-13 aggregation-exclusion 87 files / 4 writers.
- `npm run redteam` — 77/77.
- `npx playwright test tests/e2e/features/nlc-composition.spec.ts --list` — 5/5 parse-clean.
- `npx vitest run tests/convention-lint.test.ts` — 4 pre-existing failures (all in `ArchiveMemberCard.tsx`/`BestIntentionsFocusSection.tsx`, neither touched by this slice) reconfirmed identical on a clean `git stash` of `main` — not a regression.
- `git status --porcelain` — exactly the 11-file change set below, confirmed empty before AND after (no concurrent lanes touched during this session).

**Seat referee finding (2026-09-07) — stale closure on the high-confidence auto-open path, FIXED.** `finalizePreFill()` originally closed over `lastSubmittedText` STATE rather than taking the text as a parameter. `handleSubmit` calls `setLastSubmittedText(text)` and then, in the SAME synchronous-continuation closure (after the `await` on the network round trip, but still the same invocation of `handleSubmit`), calls `finalizePreFill()` on the high-confidence auto-open path — a state update scheduled earlier in that same closure has not yet applied to variables read within that closure, so `finalizePreFill` was reading the PREVIOUS value of `lastSubmittedText` (`''` on the very first submit of a session), meaning Probe 4's exact path (a high-confidence "morning routine" match) would have opened `RoutineBuilderWizard` with an EMPTY description — the precise gap `finalizePreFill()` was built to close, silently un-closed on its most direct path. The three confirmation-card button call sites (medium-confidence "Yes, open it", the error-fallback catalog, the low-confidence catalog list) were NOT affected — they fire from a separate, later user click after React has re-rendered with the committed `lastSubmittedText` value.

**Fix:** `finalizePreFill(wizardType, preFill, text)` now takes `text` as an explicit third parameter instead of reading state — genuinely stable (`useCallback(..., [])`). The high-confidence call site (line ~182) passes the LOCAL `text` const from `handleSubmit`'s own scope (guaranteed correct, no state round-trip needed at all). The three later call sites pass `lastSubmittedText` (correct at that point, per the reasoning above). `tsc -b` and `eslint` re-verified clean (0 errors, 0 new warnings) after the fix; `tests/e2e/features/nlc-composition.spec.ts --list` re-verified 5/5 parse-clean (Probe 4's assertion — the EXACT phrase as the textarea value — now actually holds on the code path it exercises). No change was needed to `tests/nlc-router.test.ts` (a router-prompt-level test, unaffected by this purely client-side bug) or to any wizard file.

### Files touched (selective-staging list)
`supabase/functions/nlc-compose/index.ts` (new) · `supabase/functions/_shared/nlc-router-prompt.ts` (new) · `supabase/supabase/config.toml` (1 new `[functions.nlc-compose]` entry) · `src/components/studio/NaturalLanguageComposition.tsx` (rewritten) · `src/pages/Studio.tsx` (`handleNLCOpenWizard` expanded to 14 outcomes, `resolveMemberIdByName` extracted, 4 new prefill state vars, `modalInitialAssigneeId` + `initialAssigneeId` wiring, NLC component always-visible) · `src/components/studio/wizards/StarChartWizard.tsx` · `src/components/studio/wizards/GetToKnowWizard.tsx` · `src/components/studio/wizards/RoutineBuilderWizard.tsx` (S3 feature) · `src/components/studio/wizards/UniversalListWizard.tsx` · `tests/nlc-router.test.ts` (new) · `tests/e2e/features/nlc-composition.spec.ts` (new) · this file.

### Seat-granted suite slot (2026-09-11) — ALL THREE SUITES GREEN. PROOF COMPLETE.

The seat deployed `nlc-compose`, granted the three-suite slot, then (after round 1) redeployed with
the first three fixes and swept the orphans. Per-suite results and every defect found:

#### Suite 1 — `tests/e2e/features/nlc-composition.spec.ts`

**FINAL: 5/5 GREEN, twice back-to-back.**

| # | Test | R1 (pre-redeploy) | R2 (naming fix) | R3 (ACTION RULE) | **FINAL** |
|---|---|---|---|---|---|
| 1 | Probe 1 — chore board → opportunity wizard, prefill, **real DEPLOY + DB assert** | ❌ `"Extra Jobs"` | ✅ PASS | ✅ | ✅ **PASS** (12.1s) |
| 2 | Probe 2 — potty chart → progress chart, Ruthie preselected | — | ❌ `"potty trips"` | ❌ traversal off-by-one | ✅ **PASS** (10.1s) |
| 3 | Probe 3 — shared grocery list → universal_list, spouse preselected | — | — | ❌ wrong Items-step UI | ✅ **PASS** (15.4s) |
| 4 | Probe 4 — morning routine → routine builder, verbatim description | — | — | ✅ | ✅ **PASS** (11.2s) |
| 5 | S3 — surprise-chore step → linked randomizer, created on accept | — | — | ❌ helper race | ✅ **PASS** (14.1s) |

Three further defects were found after the redeploys, all in the SPEC's own traversal/assumptions —
never in an assertion, and never in the product (each was confirmed against the real component and,
for probe 2, against a tour screenshot that already showed the correct rendering):

- **Probe 2 — step traversal off by one.** `STEPS = [name, action, display, milestones, assign,
  review]`; from `action` (1) reaching `assign` (4) takes THREE Next clicks, and the spec did two,
  landing on Milestones where the pill is legitimately absent. (`MemberPillSelector` DOES stamp
  `data-testid="member-pill-${id}"` and the chart wizard uses it — the locator was right all along.)
  Identical off-by-one to the one caught and fixed in the ST-B tour.
- **Probe 3 — the Items step is a BULK-PASTE textarea, not a repeat-add list.** The spec clicked a
  non-existent "Add item" button. The textarea binds to `state.rawInput`, and `canAdvance` for that
  step requires `state.items.length > 0`, which ONLY `parseItems` ("Organize with AI") produces —
  so the spec now pastes, organizes, waits for "N items ready", then advances, exactly as mom does.
  The failure screenshot independently re-proved the F-01 routing fix: "Create a List" with Purpose
  auto-completed, i.e. it landed on `UniversalListWizard`, not `shared_task_list_wizard`.
- **S3 — a race in `confirmMediumConfidenceIfShown`.** It probed for the "Yes, open it" button with
  a 3s timeout while the router round-trip takes 5-9s, so the probe expired BEFORE the card
  rendered, silently skipped the click, and the wizard never opened. The screenshot showed the card
  sitting on screen unclicked. Probes 1-4 passed only because those phrases draw HIGH confidence and
  auto-open; "set up an evening routine" draws MEDIUM. Now races the two real outcomes (dialog vs
  card) with a 30s ceiling, so it waits exactly as long as the model takes and no longer. The suite
  timeout also went 90s → 120s (matching `studio-shelf-truth`) since probes 3 and 5 each make TWO
  real AI round-trips. **Re-ran twice to confirm this holds across a different confidence draw.**

**Three router defects found, all fixed in code, NO assertion touched.** Each was verified through
the vitest path (direct OpenRouter call — no deployed function, outside the production-touch gate):

1. **`nlc-compose` pinned no `temperature`.** Routing + field extraction is deterministic-by-intent,
   and every other extraction/classification function in the platform pins `temperature: 0`
   (`calendar-extract`, `validate-ai-output`, `safety-classify`'s classifier path, the
   board-of-directors gates). At the model default the router re-decided borderline extractions
   run-to-run — a phrase naming two plausible titles ("chore board … extra jobs") returned either.
   Fixed, and mirrored into `tests/nlc-router.test.ts` so the pin calls the router the way the
   function does. Verified: 5 consecutive live calls, 5/5 identical.
2. **The prompt had ZERO naming guidance.** With determinism restored it stabilized on the WRONG
   name — "Extra Jobs" is what's *on* the board, not the board. Mom said "a chore board"; Convention
   #249 names a thing for what it is. Fixed with a NAMING RULE covering every name-shaped field
   (listName/title/chartName/subjectName/routineName): take the head noun of what she asked for,
   ignore trailing contents/purpose clauses. Re-verified 5/5 → "Chore Board". **Probe 1 then passed
   end-to-end including its real deploy**, confirming the fix in production.
3. **No guidance for `actionTaskName` either — same root-cause class.** The router deterministically
   returned the PLURAL "potty trips". That field is not a label: it becomes `tasks.title`, a real
   tappable task on the kid's dashboard, and the field's own help text says *"Creates a tappable
   task. Each tap = one mark on the chart"* with singular placeholders (*"e.g., Used the potty!,
   Practiced piano"*). A plural title contradicts the wizard's own stated design. Fixed with an
   ACTION RULE stating the SEMANTICS (one tap = one occurrence → name a single occurrence)
   deliberately rather than a surface form, so the rule isn't written to match a test string.
   Re-verified → `"potty trip"`, matching the test on its own merits.

**All four probe phrases verified stable + correct after the ACTION RULE** (each called twice;
`stable: true` on all four), so one redeploy should carry suite 1 to 5/5 rather than surfacing the
next field serially:

| Phrase | wizardType | preFill |
|---|---|---|
| chore board … extra jobs | `list_reveal_assignment_opportunity` (high) | `{"listName":"Chore Board"}` |
| potty chart for Ruthie | `repeated_action_chart` (high) | `{"chartName":"Potty Chart","actionTaskName":"potty trip","memberName":"Ruthie"}` |
| shared grocery list with my husband | `universal_list` (high) | `{"title":"Grocery List","listType":"shopping","sharedWithRelationship":"spouse"}` |
| help me set up a morning routine | `routine_builder` (high) | `{"routineName":"Morning Routine"}` (description is client-guaranteed verbatim) |

Full 29-case router vitest **29/29** after every prompt change — no other routing or extraction
expectation regressed.

#### Suite 2 — `tests/e2e/features/studio-shelf-truth.spec.ts`: **16/16 GREEN** (run twice)

First attempt had test 3 time out inside the shared `loginAsAlex` helper on
`waitForLoadState('networkidle')` — the documented flake class (TEEN-CRED / family-auth-two-door
records); it passed at 29.6s on re-run, confirming no regression from ST-B's `UniversalListWizard` /
`Studio.tsx` changes.

#### Suite 3 — Studio audit tour: **1/1 GREEN, 89 tiles, ZERO console errors**

Three tiles recorded "no dialog"; I read all three screenshots rather than infer — all three DO open
the member picker, which simply isn't a `role="dialog"` element. Zero dead tiles. (Confirmed
still-open, pre-existing, already-ST-G-scoped: that picker offers Amy — a Special Adult — and mom.)

**ST-B eyes-on tour (new): `nlc-composition-eyes-on-tour.spec.ts`, 2/2 at desktop 1440 + mobile 375,
14 shots, all read, zero console errors.** Rows in the Mom-UI table above.

#### A fourth defect, found by READING a screenshot (no assertion covered it)

On the mobile fallback shot the restate rendered as *"you want to **this phrase doesn't match any
family management wizard. Please describe what you'd like to set up…***" — the model answered the
routing question in the mom-facing `description` field, producing a broken sentence and leaking
machine voice at mom. Same class as the F-12 restate bug, which `normalizeRestate()` only guarded
against as a leading-prefix problem. Fixed in two layers, mirroring how `finalizePreFill` guarantees
verbatim client-side rather than trusting the model: the prompt now forbids meta-commentary and
multi-sentence answers in that field, AND `normalizeRestate(description, momText)` rejects
meta-commentary / multi-sentence / over-long values and falls back to mom's own words — which is
what Composition doc §2.9 asks the fallback to restate anyway. The client guard needs no redeploy
(frontend is served from local dev) and the re-run tour confirms it live: the sentence now reads
"you want to xylophone tuesday sandwich protocol". 4 new unit cases;
`tests/studio-shelf-truth-units.test.ts` **16/16**.

#### A fifth defect, found by the residue query — and it is NOT ST-B's

The name-based residue check reported zero. A stronger time-window check — *any* row created in the
five tables during the session, regardless of name — found **5 orphaned `tasks` rows**. Root cause:
in `studio-shelf-truth.spec.ts`, test 5's sequential child tasks keep their seeded chapter titles
("Chapter 1: Getting Started", …) and never carry `PREFIX`, so the title-prefix task sweep never
collected them; deleting the parent collection orphaned all 5 on **every single run**. Production
held **30 orphans across 6 runs** — 25 from the ST-A build sessions (2026-08-23/24), which reported
"zero residue" for exactly the reason the first check here did: a name-based sweep cannot see them.
Same failure class the TEEN-CRED record documents. Fixed the sweep to collect children via the
`sequential_collection_id` FK *before* the parent row is deleted, and verified decisively: a full
16/16 re-run that creates 5 chapter tasks left the total at **30, not 35**. The 30 pre-existing
orphans were left for the seat (unprefixed production rows, 25 predating this session) and the seat
has since deleted them — re-verified here: **0 "Chapter %" tasks remain**, `tasks` total 245→215.

#### Residue — both queries, after TWO consecutive 5/5 runs (window from `2026-09-11T19:22:54.931Z`)

| Table | (A) time-window: rows created during the runs, ANY name | (B) fixture-name matched, whole table |
|---|---|---|
| `lists` | 0 | 0 of 57 |
| `list_items` | 0 | 0 of 216 |
| `tasks` | 0 | 0 of 215 |
| `dashboard_widgets` | 0 | 0 of 51 |
| `wizard_templates` | 0 | 0 of 0 |
| **TOTAL** | **0** | **0** |

Every row these runs created — including probe 1's real board deploy and S3's real randomizer list —
was swept by the suite's own `afterAll`. `"Chapter %"` orphans remaining = **0** (seat's sweep
independently re-confirmed).

**A note on query (B), because it cuts both ways.** An intermediate run used a deliberately
over-broad keyword filter ('milk', 'eggs', 'bread', 'surprise', 'Morning Routine', 'Potty Chart')
and returned 20 "matches" — all of which were **genuine pre-existing founder data** dated March–May
2026 (real grocery items like "12 bags Guittard milk chocolate chips", real widgets named "Morning
Routine"), none from this session. That false-positive direction is the mirror image of the weakness
that let a name-based sweep MISS the orphaned chapter tasks earlier. Which is the whole point: **the
time-window query (A) is the authoritative residue check**; name matching is a supplement, never the
proof. The table above reports (B) against the strict fixture names only.

#### Nothing outstanding

No deploys, migrations, applies, invocations outside the browser flow, or row deletions were
performed by this lane at any point.

### Selective-staging file list (16 entries — verify against a FRESH `git status` at commit time)

| # | File | Why it's in this commit |
|---|---|---|
| 1 | `supabase/functions/nlc-compose/index.ts` | NEW — the dedicated NLC Edge Function (+ `temperature: 0`) |
| 2 | `supabase/functions/_shared/nlc-router-prompt.ts` | NEW — shared 15-outcome catalog + NAMING RULE + ACTION RULE + no-meta-commentary rule |
| 3 | `supabase/supabase/config.toml` | 1 new `[functions.nlc-compose]` entry (`verify_jwt = false`, auth in code) |
| 4 | `src/components/studio/NaturalLanguageComposition.tsx` | Rewritten onto `nlc-compose`; `finalizePreFill` stale-closure fix; `normalizeRestate` meta-commentary guard |
| 5 | `src/pages/Studio.tsx` | 14-outcome routing, `resolveMemberIdByName`, 4 prefill state vars, `initialAssigneeId` wiring, NLC always-visible (F-07) |
| 6 | `src/components/studio/wizards/StarChartWizard.tsx` | New prefill entry state (`initialChartName`, `initialMemberIds`) |
| 7 | `src/components/studio/wizards/GetToKnowWizard.tsx` | New prefill entry state (`initialMemberId`, skips the person-picker step) |
| 8 | `src/components/studio/wizards/RoutineBuilderWizard.tsx` | Prefill entry state + the S3 linked-randomizer detection/HITM-accept feature |
| 9 | `src/components/studio/wizards/UniversalListWizard.tsx` | Prefill entry state (title/items/listType/sharing) + Purpose-step skip |
| 10 | `tests/nlc-router.test.ts` | NEW — 29-case live router pin; mirrors the function's `temperature: 0` |
| 11 | `tests/e2e/features/nlc-composition.spec.ts` | NEW — the 5 ST-B probe pins (probe 1 deploys for real + asserts DB rows) |
| 12 | `tests/e2e/features/nlc-composition-eyes-on-tour.spec.ts` | NEW — Convention #277 ST-B tour, desktop + mobile |
| 13 | `tests/e2e/features/studio-shelf-truth.spec.ts` | **ST-A file** — sweep fix for the orphaned-sequential-children leak (defect 5) |
| 14 | `tests/studio-shelf-truth-units.test.ts` | **ST-A file** — 4 new `normalizeRestate` cases for the meta-commentary guard (defect 4) |
| 15 | `.gitignore` | Adds `studio-audit-out/`; the tour's 90-screenshot dump was untracked and one `git add .` from being committed (`eyes-on-tour/` was already ignored) |
| 16 | `.claude/rules/current-builds/STUDIO-EXPERIENCE.md` | This build record |

Entries 13–15 are outside ST-B's original file list and are called out deliberately: 13 and 14 fix
real defects in ST-A-owned files that this slice's proof surfaced, 15 is hygiene created by this
session's own tour. No other lane's files are in the tree.

**Next steps:** the redeploy + suite-1 re-run above, then founder review + selective staging +
commit, same discipline as ST-A/ST-F.

## Retroactive verification (founder ruling)
The graded 89-tile matrix + Pass B/scenario evidence in the evidence record §2–§3 constitutes the retroactive Post-Build Verification for Phase 3.7 and Phase 3.8 (their feature-decision files' tables were never filled). Copy at close-out.

## Mom-UI Verification

*(Convention #277 Claude-driven visual pass — Claude toured the flow, read the screenshots, recorded verdicts. Screenshot set: `<scratchpad>/studio-audit/s-m77-*.png` + `TOUR-*` records in scenarios.ndjson.)*

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Progress Chart wizard steps 1-6 (post ST-0 + F-23 micro-fix) | ✅ 1440px — all 6 steps render, step dots, prefill, Casey pill selectable | — (not toured; modal is width-fluid between the two verified extremes) | ✅ 375px — bottom-sheet modal, steps/inputs/nav reachable, no clipping | Mom | s-m77-desktop-1…6, s-m77-mobile-1…6 (read by Claude) | 2026-07-04 |
| **Success screen ("Chart deployed!")** — first time reachable in production | ✅ star icon + "STUDIOAUD Tour Chart is active…" + Done | — | ✅ same at 375px | Mom | s-m77-desktop-7-SUCCESS, s-m77-mobile-7-SUCCESS + TOUR-*-success-screen text records | 2026-07-04 |
| Deployed chart on kid surfaces | ✅ Casey dashboard: both star-chart widgets (0/20, star rows) render in Trackers & Widgets; both action tasks at top | — | — | Independent (Casey) | s-m77-casey-dashboard, s-m77-casey-tasks + TOUR-casey-render {widgetVisible:true, taskVisible:true} | 2026-07-04 |
| **ST-A** Extra House Jobs Board example → prefilled board wizard (F-04a) | ✅ wizard at Add Items & Rewards, name + "Vacuum the living room" + reward row prefilled, Who Can Browse step dot present | — | ✅ (board wizard verified at 375px via sharing-step shot) | Mom | studio-tour-sta/21 + sta-mobile-2 (read by Claude) | 2026-08-23 |
| **ST-A** "Who Can Browse" kid-scoped sharing (rider b) | ✅ (E2E-asserted pill absence) | — | ✅ 375px bottom-sheet: All kids / Specific people with Everyone+Alex+Casey+Jordan+Ruthie pills in member colors, NO adults/Special Adults, "Show adults too" opt-in link | Mom | studio-tour-sta/sta-mobile-2-board-sharing-step.png (read by Claude) | 2026-08-23 |
| **ST-A** Opportunity Board blank tile → board wizard (F-05) | ✅ board wizard Add Items step (not TaskCreationModal), themed | — | — | Mom | studio-tour-sta/17 (read by Claude) | 2026-08-23 |
| **ST-A** Curriculum Chapter Sequence prefill (F-04b) | ✅ Sequential modal, title + 5 chapters + "5 items detected", kid-only assignee pills | — | — | Mom | studio-tour-sta/22 (read by Claude) | 2026-08-23 |
| **ST-A** SODAS Sibling Conflict prefill (F-04c) | ✅ "Assign SODAS" w/ example title chip, full warm Situation pre-filled, child sections locked "Child fills this" | — | — | Mom | studio-tour-sta/29 (read by Claude) | 2026-08-23 |
| **ST-A** TSG tile → hydrating create form (F-04d) | ✅ Lists page "New Randomizer" + "Creating from template" banner + name pre-filled | — | — | Mom | studio-tour-sta/24 (read by Claude; tour's ERROR suffix is its own bookkeeping race — flow works, deploy DB-pinned) | 2026-08-23 |
| **ST-A** Best Intentions Starter wizard (F-06) | ✅ real 2-step wizard: 4 category suggestion groups + write-your-own + Review | — | ⚠️ see flag below (pre-existing Growth-section mobile behavior, control-proven) | Mom | studio-tour-sta/50 + sta-mobile-1 (read by Claude) | 2026-08-23 |
| **ST-A** Reward Spinner tile → real spinner config | ✅ Configure Widget: "Spinner · standard spinner", title, Assigned To, Reward Reveal, Deploy to Dashboard | — | — | Mom | studio-tour-sta/48 (read by Claude) | 2026-08-23 |
| **ST-A** full shelf sweep (50 non-tracker tiles) | ✅ every tile opens its intended surface, ZERO console errors on all 50 | — | — | Mom | studio-tour-sta/pass-a.ndjson + 50 screenshots (STUDIO_AUDIT Pass A re-run; dlg:0 rows for Reading Fun / Subject Activities are one-shot capture flakes — Homeschool Variety Pack on the identical ActivityListWizard branch opened fine) | 2026-08-23 |

**ST-A flags for founder/seat (neither is an ST-A regression — both control-proven pre-existing):**
1. **Growth-section cards don't open their wizards under synthetic 375px clicks** — BOTH Best Intentions Starter (new) AND Get to Know Your Family (untouched pre-ST-A control) fail identically, zero console errors, while board-section cards open fine in the same run. Desktop opens both. Real-device touch may behave differently (onClick handles taps); needs a quick real-phone tap check — same family as the ST-0 note "watch real-mom tap reliability on 375px pills". Suggested home: ST-E's shelf/tap work or the founder's next phone spot-check.
2. **`studio-intelligence-phase1.spec.ts` test 1C is stale** — asserts the Tasks → Sequential tab that FO-COMMAND-CENTER retired (Conv #150/#275). Pre-existing failure on clean main (zero ST-A diff on Tasks.tsx or the spec). Needs re-pointing at the FO spot-check Sequential tab by whoever owns that pin.

Visual-pass notes fed back into slices: (1) mobile Assign pill needed a verified-select retry in the tour — watch real-mom tap reliability on 375px pills (ST-A eyes); (2) the Assign step says "Each child gets their own independent chart" while offering Everyone/Mark/Amy/Kylie (adults + Special Adults) as pills — same member-classification smell as S1/B8; fold into ST-A item 9 / ST-E default-assignee work.

**ST-F — visual confirmation is via the E2E flow itself (real browser, real clicks) plus screenshots captured and read during debugging, NOT a formal EYES_ON_TOUR pass across viewports (flagged above as a residual — worth a short follow-up before founder sign-off if a full row set is wanted).** Desktop 1280×720 only (Playwright's default viewport); no tablet/mobile pass for ST-F specifically.

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| **ST-F** TaskCompletionExpander on an approval-required opportunity claim (Mark complete → note/photo → "Submit for Approval") | ✅ read directly: item card "In Progress / Claimable / Alex", expander with note field + Add photo + Cancel/Submit for Approval, all rendered correctly | — (not toured) | — (not toured) | Independent (Alex) | ad-hoc debug screenshot, read during troubleshooting (removed after confirming) | 2026-08-23 |
| **ST-F** Post-submit celebration (task moves out of Active, floating sparkle toast w/ item name) | ✅ read directly: "No tasks yet" in Active filter + bottom-right sparkle bubble "STUDIOAUD Wash the car — Add a note?" | — | — | Independent (Alex) | ad-hoc debug screenshot, read during troubleshooting (removed after confirming) | 2026-08-23 |
| **ST-F** Family Overview Approvals tab, empty vs populated | ✅ E2E-asserted (locator found + clicked the row); "Nothing waiting for approval" empty-state read directly during an earlier debugging pass, confirmed the tab itself renders correctly | — | — | Mom | ad-hoc debug screenshot (empty state, pre-fix) + E2E pass (populated state, post-fix, DB-asserted not screenshot-read) | 2026-08-23 |
| **ST-F** Draw-flavor "Pick a Reveal" step (animation card grid) | ✅ read directly: step 3/7 "Pick a Reveal", Spinner/Card Flip/Door Open/chest variants render as themed cards | — | — | Mom | ad-hoc debug screenshot, read during locator troubleshooting | 2026-08-23 |
| **ST-F** Randomizer draw + assign flow (Draw button → spin → Assign to → member picker → Confirm) | ✅ E2E-asserted only (real clicks succeeded, real `tasks` row landed with correct assignee) — not separately screenshotted/read | — | — | Mom (assigning) | E2E pass, DB-asserted | 2026-08-23 |
| **ST-F** Drawn task rendering on the assignee's own Tasks page | ✅ E2E-asserted (`getByText` found the task title on Alex's `/tasks`) — not separately screenshotted/read | — | — | Independent (Alex) | E2E pass | 2026-08-23 |

*(ST-B rows below — Convention #277, `tests/e2e/features/nlc-composition-eyes-on-tour.spec.ts`, 2/2 green at BOTH viewports, all 14 screenshots read by Claude, zero console errors at either viewport. Tablet was not toured: every ST-B surface is a ModalV2 dialog that is width-fluid between the two verified extremes, matching the ST-A precedent for the same dialogs.)*

| Surface | Desktop 1440 | Tablet ~768px | Mobile 375 | Shells Tested | Evidence | Timestamp |
|---------|--------------|---------------|------------|---------------|----------|-----------|
| **ST-B** F-07: NLC input stays visible while the Studio search box has text | ✅ search filtered to "chart", NLC input still rendered above the filtered results (it used to be hidden behind `{!searchQuery.trim() && …}`) | — | ✅ same at 375px; "Use as-is" + "Customize" on the Potty Chart example also render correctly | Mom | `nlc-stb-{vp}-2-nlc-visible-while-searching.png` (both read) | 2026-09-11 |
| **ST-B** §2.9 full-catalog fallback (`none_confident`) | ✅ second-person restate, full outcome-named catalog with "Best match" first, mom's text preserved in the input, never "I don't understand" | — | ✅ full catalog readable at 375px, BottomNav present, cards stack cleanly | Mom | `nlc-stb-{vp}-3-fallback-full-catalog.png` (both read) | 2026-09-11 |
| **ST-B** Restate copy guard (tour finding, fixed + re-verified) | ✅ after fix reads "you want to **xylophone tuesday sandwich protocol**" — mom's own words, sentence frame intact | — | ✅ same (this is the viewport the defect was caught on) | Mom | `nlc-stb-mobile-3` before/after (both read) | 2026-09-11 |
| **ST-B** Prefilled wizard from a description — chart name (probe 2) | ✅ "Set Up a Progress Chart" opens at step 1/6 with Chart name = "Potty Chart" | — | ✅ bottom-sheet, step dots condense, all fields reachable | Mom | `nlc-stb-{vp}-4-prefilled-chart-name.png` (both read) | 2026-09-11 |
| **ST-B** Prefilled action name (probe 2) | ✅ step 2/6 "Pick Action", task input = "potty trip" | — | ✅ same ("potty trips") | Mom | `nlc-stb-{vp}-5-prefilled-action-name.png` (both read) | 2026-09-11 |
| **ST-B** memberName resolution → Assign preselect (probe 2) | ✅ step 5/6 Assign: Ruthie's pill FILLED in her member color, Alex/Casey/Jordan outline-only; pill bar kid-scoped (no adults/Special Adults — ST-A rider (b) still holding) | — | ✅ same at 375px, Back/Next reachable | Mom | `nlc-stb-{vp}-6-assign-ruthie-preselected.png` (both read) | 2026-09-11 |
| **ST-B** Routine builder verbatim description passthrough (probe 4) | ✅ Routine Name "Morning Routine" + textarea holding the EXACT original phrase "help me set up a morning routine" — the `finalizePreFill` guarantee, on the very path the seat's referee finding flagged | — | ✅ same at 375px | Mom | `nlc-stb-{vp}-7-routine-verbatim-description.png` (both read) | 2026-09-11 |
| **ST-B** Studio shelf sweep regression (Pass A tour) | ✅ 89/89 tiles open their intended surface, **zero console errors across all 89** | — | — | Mom | `studio-audit-out/pass-a.ndjson` + 89 shots; 3 flagged "no dialog" tiles read individually and confirmed WORKING (member picker isn't `role="dialog"`) | 2026-09-11 |

## Post-Build Verification
*(Checkpoint 5 of the cleanup build — every finding F-01…F-21 + Bucket-1 item: Wired / Stubbed / Missing. Zero Missing required.)*
