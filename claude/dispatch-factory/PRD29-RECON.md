# PRD-29 BigPlans — Recon Evidence Brief (Sonnet reader, 2026-07-04)

> Archived by the dispatch factory (condensed, citations kept). Consumed by `PRD29.md`.
> Prior deep audit exists: `.claude/completed-builds/scope-3-8b-evidence/EVIDENCE_prd29-cross-prd-impact.md`.
> TRIAGE status: **Defer-to-Gate-4** (TRIAGE_WORKSHEET row 71, SCOPE-2.F67 — "Enhanced-tier flagship,
> post-launch"). Drift-fix rows: 84 (SCOPE-3.F32, mode taxonomy) + 158 (SCOPE-3.F13, false-WIRED sockets).

## A. Scope inventory

Three immutable plan types (`plans.plan_type` goal/project/system): goal backward-planning (deadline→milestones, planning-fallacy buffer, pre-mortem); multi-step project (parallel tracks, cross-track milestone deps, per-milestone assignment); system/routine design (Friction Detective 4-category taxonomy knowledge/motivation/logistics/capacity → deploys REAL components: routine, task, sequential, best_intention, tracker, calendar_event, list → 14-day default trial → check-in → Persist/Pause/Pivot).

6 screens: (1) main page (filters/sort/cards/empty state); (2) Plan Card (progress bar, tappable milestone dots, Guiding Star chips, trial countdown, breathing-glow check-in); (3) Plan Detail 3 tabs Plan/Journal/Conversations + Milestones (Break Down→Task Breaker, Create Sequential) + Ecosystem Map (system) + Parallel Tracks (project); (4) Compile Review — per-type AI output, HITM per component, "Deploy Plan"; (5) Check-In Conversation (rhythm-triggered/on-demand, Persist/Pause/Pivot); (6) Manual creation (no-AI form, 3 plain-language types, rhythm picker, trial days).

Permissions: mom full; dad own CRUD + family-create only w/ `bigplans_family_create`; SA absent; teen own goal/project only (system mode hidden); Guided/Play absent.

Schema: `plans`, `plan_milestones`, `plan_components`, `plan_check_ins`, `friction_diagnosis_templates` (platform_intelligence), `freebie_friction_results` (stub) + journal/tasks `related_plan_id` wiring + `studio_queue.source='project_planner'` + `best_intentions.source='bigplans'`.

AI: 4 guided modes per PRD/addendum (`bigplans` router + goal/project/system sub-modes, all Sonnet); dedicated `bigplans-compile` EF (3 output schemas); cross-conversation friction-detection intent pattern (pgvector, 3+ mentions/14 days, 7-day suppression); "Active Plans" context block everywhere.

7 tier keys: bigplans_create (Enh), bigplans_system_design (FM), bigplans_family (Enh), bigplans_family_create (Enh mom-granted), bigplans_check_in[s] (Enh — PRD body singular vs everywhere-else plural), bigplans_ecosystem_map (FM), bigplans_manual (Ess).

## B. What exists — verdict: **0% built as a feature**

- All 6 tables: ABSENT (not even in schema-dump DOMAIN_ORDER).
- `/bigplans` route exists (`App.tsx:223`) → PlaceholderPage w/ `featureKey="bigplans_create"` which isn't registered → generic "Coming in PRD-29" card. **NOT in sidebar** (zero getSidebarSections hits) — reachable only by typed URL / ViewAsModal branch (`ViewAsModal.tsx:112`).
- `bigplans-compile` EF: absent.
- **Guided-mode DRIFT:** migration 000007:262-267 seeded FIVE different modes (`bigplans_planning`, `bigplans_friction_finder`, `bigplans_checkin`, `bigplans_system_design_trial`, `bigplans_deployed_component`) with full prose prompts in `lila-chat/index.ts:132-144`; parent `bigplans` never INSERTed (only an UPDATE target in migration 000013:143-144). `ai_patterns.md` documents the 5-mode list; `audit/CORRECTED_GUIDED_MODE_REGISTRY.md:92-99` + `CORRECTED_FEATURE_KEY_REGISTRY.md:395-402` (authoritative per CLAUDE.md preamble) carry the PRD's 4-mode naming. Orphaned infrastructure — prompts with no UI/tables/compile.
- Context assembly: 'bigplans' appears only in mode-classification arrays (`src/lib/ai/context-assembly.ts:40,53,71,89`); zero `from('plans')` anywhere.
- Pre-wired sockets, ZERO writers: `tasks.related_plan_id` (000008:108, no FK; idx :119) + `source='project_planner'` in CHECKs (100023:291 + 7 migrations) — only type-decl reference (`types/tasks.ts:46`); `journal_entries.related_plan_id` (000006:19, no FK); `studio_queue.destination` is UNCONSTRAINED TEXT (000008:442-461 — addendum's "add CHECK value" is a no-op); `best_intentions.source` unconstrained (000005:59); `victories.source` CHECKs already accept `plan_completed`/`milestone_completed` in 3 migrations incl. the Phase-3 victory_godmother path (100223:11-12) — zero writers.
- RoutingStrip: no bigplans destination tile. BookShelf ApplyThisSheet:126-131 `comingSoon:true` (correctly stubbed). Studio wizard `flag_big_projects` checkbox (`listPresets.ts:61`) = dead no-op affordance.
- Feature keys: ZERO bigplans_ rows in feature_key_registry seeds; every `requires_feature_key` in the seeded modes points at nonexistent rows; `bigplans_ai_compile` exists only in a test fixture + docs (fully orphaned).
- No dashboard widget type; no Platform Intelligence System-Design-Patterns channel.

## C. Schema gaps

All 6 tables absent. `tasks.related_plan_id` + `journal_entries.related_plan_id` present WITHOUT FKs (add when `plans` lands). `studio_queue.destination` + `best_intentions.source` unconstrained TEXT — writer code only, no migration needed (addendum scope correction).

## D. Waiting-on list (citations)

Meetings Goals routing (STUB:225 — note: current RoutingStrip `meeting_action` set has no disabled Goals tile; possible doc drift); BookShelf→BigPlans (STUB:296, ApplyThisSheet live stub); Daily-Progress Path I track toggles (STUB:536, addendum :427-433); ThoughtSift route-to-BigPlans chips (STUB:556); LifeLantern complex-goal handoff (double-deferred — 12A also unbuilt; routes via studio_queue `source='goal_decomposition'`); Convention #167 pick-N-of-M badge container (Linked-Steps addendum :407-539); Learning-Path duplication at container level (:467-469); Conversational School Year Planner (gated on PRD-05+18+29); Rhythms periodic check-in card (`bigplans_checkin_{plan_id}` — zero registration); victory writers; PI System-Design-Patterns channel.

Dependency chain: PRD-05 mode reconciliation, PRD-09A socket writers, PRD-12A (itself unbuilt), PRD-17 destinations, PRD-18 rhythm card. **Parked Defer-to-Gate-4 per triage.**

## E. Conflicts (named)

1. **Three competing mode taxonomies** (PRD 4-mode router / seeded+prompted+ai_patterns 5-mode / audit-CORRECTED 4-mode w/ own key mapping) — tracked as SCOPE-3.F32 (drift-fix) + SCOPE-3.F13 (false-WIRED sockets). PRD-internal: `bigplans_check_in` singular vs plural elsewhere.
2. **Convention #276 direct-deploy vs PRD Screen 4's studio_queue deposit** — compile review IS the card-by-card HITM; #276 forbids queue-then-re-review.
3. **Convention #250** — no `is_draft` on plans, no Drafts-page integration, no Save & Come Back in Screen 6.
4. **Conventions #251/#252** — Screen 6 multi-item forms lack per-field Let-AI-help + bulk-AI-add (both now mandatory).
5. **Convention #253** — router mode ≈ NLC entry point; #253 specifies Haiku parse, PRD says all-Sonnet (prior audit flagged "no Haiku offloading" too).
6. **Convention #254 vs #192** — MindSweep-Lite destination vocabulary has no 'plan'; config-worthy detection can't route to BigPlans without classifier vocabulary addition.
7. **Convention #256** — tier keys must route through the chart, no hardcoded checks.
8. **Convention #276 task_assignment** — does `bigplans_family_create` alone let dad assign milestone tasks to kids? PRD silent; #276 says task_assignment grant is THE single authority.
9. **Convention #150** — Create Sequential must route through SequentialCreatorModal/useCreateSequentialCollection; PRD text doesn't name the path.
10. **Convention #257** — plans has 5 DATE columns; PRD predates the rule.
11. Addendum scope correction: no CHECKs exist on studio_queue.destination / best_intentions.source.

## F. Open questions (absorbed into pack decisions)

1. Which mode taxonomy wins; 2. confirm Defer-to-Gate-4; 3. redesign deploy per #276; 4. family_create vs task_assignment; 5. Screen 6 as Composition-compliant wizard; 6. Haiku router split; 7. freebie funnel stays stub; 8. orphaned bigplans_ai_compile key cleanup timing.
