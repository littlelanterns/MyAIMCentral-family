# Pre-Dispatch Pack — PRD29: BigPlans (Goal Science Edition)

> **Factory status: APPROVED — RE-SYNTHESIZED 2026-07-04 against the founder-approved
> `prds/addenda/PRD-29-Goal-Science-Addendum.md`** (all 24 §17 decisions ruled, incl. the D6
> FINAL minor-privacy posture and the D22 no-alert extension — this pack carries ZERO open
> decisions). Supersedes the 2026-07-04 morning pack version in full.
> **Authority chain:** `claude/feature-decisions/BigPlans-Goal-Science-Vision.md` → the
> Goal Science Addendum (WINS over the base PRD wherever they conflict, Convention #11) →
> `prds/platform-complete/PRD-29-BigPlans.md` → PRD-29 Cross-PRD Impact Addendum.
> **Evidence:** `claude/dispatch-factory/PRD29-RECON.md` (still-valid 0%-built verdicts, drift
> findings, socket inventory) + prior audit
> `.claude/completed-builds/scope-3-8b-evidence/EVIDENCE_prd29-cross-prd-impact.md`.
> **Sequencing: TRKG dispatches FIRST** (the co-planning chart reward consumes tracker-goal→
> prize firing). If TRKG slips, charts still deploy — prize firing lights up when TRKG lands
> (addendum §12.9) — but the ruled order stands.
> Scale: flagship, THREE build phases (A → B → C), each its own worker session with its own
> dispatch prompt below. Playwright is the only proof of done.

## What this is now (plain English)

BigPlans grew from "project planner" into the platform's goal-accomplishment engine: five plan
spines (goal / project / system / **becoming** / **overcoming**), a research-grounded method
set productized under platform names (Wish & Way, When-Then Plans, Horizon, Bounce-Back Plans,
Just Today, The Wheel, Stop & Swap), four audience tiers (adult, teen, Guided "My Goals,"
kid-with-mom co-planning with a chart or coloring-page reward), and the outcome-reframe
conversation that turns "lose 15 lbs" into commitments the person actually controls.

## Reconciliation rulings — carried, superseded, and new (all binding)

**Carried from the original pack (still law):**
1. Compile review deploys DIRECTLY via the shared engine (Convention #276) — never
   queue-then-re-review; `studio_queue destination='plan'` only for context-incomplete seeds.
2. Manual creation is a Composition-compliant wizard (#249-#256): `plans.is_draft`, Drafts
   page, Save & Come Back, per-field Let-AI-help, bulk-AI-add, NLC pre-population (§5.6).
3. `bigplans_family_create` NEVER bypasses `task_assignment` authority (#276); pickers via
   `useAssignableMembers()`; WITH CHECK backstops; no error theater on ungranted kids (§15).
4. Create Sequential ONLY via `SequentialCreatorModal`/`useCreateSequentialCollection` (#150).
5. Convention #257 on every DATE (all writes server-derived — plans dates, check_in_date,
   spoke dates, next_rim_date, next_check_in_date).
6. Victories via the connector only (fireDeed → victory_godmother; CHECK values pre-exist).
7. MindSweep gains ADULT 'plan' vocabulary only (#254; Convention #192's teen list untouched).
8. No CHECK migrations for `studio_queue.destination` / `best_intentions.source` (unconstrained
   TEXT — writer code only). `tasks.related_plan_id` + `journal_entries.related_plan_id` FKs
   land with the schema slice.
9. Sidebar entry ships with full Convention #16 mobile parity; feature keys through the tier
   chart (#256), zero hardcoded tier names; orphaned `bigplans_ai_compile` key retired.

**Superseded by the addendum (newer wins):**
10. **Mode taxonomy is now the §11 SEVEN-mode registry** (supersedes the pure 4-mode CORRECTED
    set the original pack ruled): `bigplans` (HAIKU router — D-PRD29-4 honored), `bigplans_goal`,
    `bigplans_project`, `bigplans_system`, `bigplans_wheel`, `bigplans_overcoming`,
    `bigplans_check_ins` (plural canonical). The five drifted seeds still migrate out
    (SCOPE-3.F32 drift-fix stands); their prose remains raw material. `ai_patterns.md` amended
    at close-out to the 7-mode list.
11. **`plan_type` is a FIVE-value CHECK** ('goal','project','system','becoming','overcoming'),
    plus `parent_plan_id` satellites and the ONE-GOAL-ONE-CARD rendering rule (§1).

**New build laws from the addendum (each with its § anchor):**
12. **D6 FINAL privacy mechanics (§7.7/§10.2)** — the most safety-critical logic in the build:
    adult Wheel/Overcoming interiors private by default (explicit `essays_shared_with` grants;
    existence + title always visible); MINOR interiors **visible to mom by default**;
    `mom_granted_privacy` is MOM-ONLY writable, the kid can NEVER modify it, every flip (both
    directions) notifies the kid, and a persistent state label renders in BOTH states. Kids
    never hold a lock — fully consistent with the standing no-hiding-from-parents principle.
    Role transition at 18: the flag goes inert, adult rules take over (§15).
13. **Crisis override is independent of every visibility state** (§14, D22-extended): privacy
    grants and slip-log ambient visibility have zero bearing on safety escalation; **no slip
    alerts and no opt-in alert toggle either**. Slips are never the safety pipeline.
14. **Teen/guided Overcoming ships DARK (§14):** built COMPLETE in Build B, gated OFF behind
    `bigplans_overcoming_teen` (also gates Guided Stop & Swap), which stays false until the
    founder flips it after PRD-41 Layer 1 + PRD-30 are live. While dark, the teen "Change
    something in me" door routes ONLY to Wheel-teen (no stop branch shown). Teen Wheel ships
    UNGATED (D11). Adult Overcoming ships live on the current safety stack (SAFETY-BETA-GATE
    C→B→A shipped 2026-07-04 — worker re-verifies at dispatch).
15. **Just Today is AI-free** (§8.4, D12) — pure UI, daily-idempotent (UNIQUE per plan/day),
    total-days-practiced headline that only grows; run counters small, silent reset, never
    streak-loss imagery.
16. **Wheel essays default `is_included_in_ai = FALSE`** (D7 — sanctioned deviation from the
    default-true convention), load only inside Wheel-mode conversations; excluded from
    reports/aggregations/spousal surfaces regardless of flag; **hard exclusion from Platform
    Intelligence capture** (§16 — no Wheel/Overcoming content ever enters PI).
17. **White-hat only (D20) + copy rules (§15):** no variable rewards, no streak pressure, no
    "overdue"/red states/failure voice anywhere in BigPlans; identity-connected celebration;
    user's own words for Hubs and Overcoming subjects; the ONE attribution carve-out is the
    bridge-to-human referral panel's real external programs (§8.7), faith-gated via
    `faith_preferences`.
18. **Cost architecture (§13):** Haiku for router/parse, kid-wizard glaze (dedicated small EF,
    guided-nbt-glaze pattern, Convention #248 category-2), and co-planning step generation;
    Sonnet for planning/Wheel/Overcoming/check-in conversations; Just Today $0. Heavy-month
    ceiling ≈ $0.70/family. All prompt sites import `buildSafetyPreamble()`.
19. **Meal/budget scope fences (D14/D15):** lists + calendar only, no nutrition engine; budget
    = `budget_amount` + linked expenses list, no new financial tables, plan budgets never enter
    LiLa context as family financial data (#225 spirit).
20. **Guided tier honors Convention #135** (D9): kid goal creation = draft → mom approval →
    deploy; "My Goals" is a registered Guided dashboard SECTION (D24), not a page.

## Slice plan (model routing per `.claude/rules/model-routing.md` — post-window: Sonnet-xhigh workers, Fable-if-available-else-Opus judgment gates; Checkpoint 1 founder approval per build phase)

### BUILD A — Foundation & Core Planning (project/goal/system classes + curriculum flagship)
| Slice | Scope | Routing |
|---|---|---|
| A1 | **Schema (greenfield — bake the addendum in from birth, no delta migrations):** `plans` (all base columns + §10.1 deltas: member_id, parent_plan_id, 5-value plan_type, maintenance status, is_draft, planning_only, wish_way, horizon_text/tracker, bounce_back_plan, budget_amount/list_id, amended source CHECK), `plan_milestones` (+`completion_rule` §10.3 — Convention #167 lands), `plan_components`, `plan_check_ins` (+§10.6 deltas: check_in_type CHECK, support_person_id, server-derived check_in_date w/ daily UNIQUE, outcome), `friction_diagnosis_templates` (platform_intelligence), freebie stub table, **`plan_wheels` (§10.2 in full — incl. mom_granted_privacy + privacy_changed_at + is_included_in_ai default FALSE)**, **`plan_support_people` (§10.5 — exactly-one-of-three person CHECK, nudge_permission seam)**, `tasks.when_then_cue` (D8, platform-wide), related_plan_id FKs; RLS per §10.1/§10.2 (owner/mom plan reads; kid read-own no-structure-write #266; plan_wheels privacy model); 13 feature keys (7 corrected-registry + 6 new §11) via the tier chart + retire `bigplans_ai_compile`; **mode-registry migration** (deactivate the 5 drifted seeds per the 100249 precedent, seed the §11 seven-mode set); DOMAIN_ORDER teach | Sonnet xhigh + rls-verifier |
| A2 | **Intake & AI core:** Start surface (NLC-primary + five §4.0 doors + task-sized redirect), Haiku router parse (intent/controllability/scale/register), `bigplans-compile` EF (Zod schemas incl. satellite-strand proposals, When-Then cues, +40% visible buffer, bounce-back stubs, first-72-hour commitment), Wish & Way conversation w/ expectancy guard (§4.1), **Horizon reframe flow (§4.2 verbatim spec incl. reject-twice grace + weight default-off D13)**, Friction Detective port + structural-rationale addition (§5.3), Active-Plans context block (one-line Wheel summaries only), HITM grid + DIRECT deploy, safety preamble everywhere | Sonnet xhigh |
| A3 | **Surfaces:** main page (Active / Keeping It Going / Paused / Drafts / Completed; Family Plans above personal; sidebar + #16 parity), plan cards (spine badges, endowed-progress bar, shared-screen-dignity rules), detail 3 tabs (+Horizon "what we've noticed" log, Commitments w/ cues, satellite sections, budget line, collapsed Bounce-Back, support-people section), **manual wizard** (§5.6 Composition-compliant; friction-review answers in the build file) | Sonnet xhigh |
| A4 | **Check-ins & the grace layer:** consolidated machinery (§6.1 types scheduled/trial_review/season), rhythm cards, weekly 15-min family check-in (§6.2), merciful checkpoints everywhere (§6.3 — the word "overdue" appears nowhere), bounce-back trigger behavior (§6.5 — two-miss rule, never first-miss), completion ceremony + `maintenance` mode (§6.6, D19/D21 fresh-start suggestions), victories via connector | Sonnet xhigh |
| A5 | **Curriculum flagship (§5.5):** "Plan a School Year" wizard (Studio tile, #249 naming), per-subject sequential collections via the #150 path, `completion_rule` pick-N-of-M consumer (curriculum-parse's `detected_metadata.pick_n_of_m` finally lands), homeschool links (subjects/counts_for_homework/related_plan_id evidence thread), co-op print/PDF + CSV export (free-text co-op names, never family_members), Copy-for-next-year (D18) | Sonnet xhigh |
| A6 | **E2E A** (`tests/e2e/features/bigplans-core.spec.ts`): create-per-spine, Horizon reframe round trip (incl. reject-twice), compile→HITM→direct-deploy probes (no queue re-review), satellite one-card rule, dad family-create + task_assignment interlock probe, draft round trip, curriculum deploy incl. pick-N-of-M milestone completion, when_then_cue render, teen sees goal/project only, Guided/Play see nothing yet + verification tables | Sonnet xhigh; gate **Fable-else-Opus** |

### BUILD B — The Wheel & Overcoming (deep work; after A)
| Slice | Scope | Routing |
|---|---|---|
| B1 | **The Wheel (§7 — founder framework verbatim-preserved):** `bigplans_wheel` Sonnet mode (consent container for Spoke 3, incremental per-spoke save, always-answers told upfront), spoke-visual detail view, both essays (export/download, adult share grants), role models, evidence log incl. blind test, Spoke-6 commitments → REAL tasks (§7.3), Rim via Universal Scheduler, `plan_support_people` CRUD (three roles + exact boundaries, spousal validation, LiLa scripts, **scheduled per-role touchpoints §7.4** + support check-in cards + 2-min evidence notes; nudge_permission seam unused) | Sonnet xhigh |
| B2 | **Privacy mechanics (D6 FINAL — ruling 12):** adult `essays_shared_with` grants; minor `mom_granted_privacy` (mom-only write path + RLS, flip notifications BOTH directions via createNotification, persistent state label both states, kid-write impossible), 18-transition inertia, PI hard exclusion + report/aggregation exclusion, InnerWorkings/GuidingStars cross-offers (user-decided, never automatic) | Sonnet xhigh |
| B3 | **Overcoming — ADULT (live):** recovery layer on the Wheel spine (§8.1-8.3: trigger map w/ environment-first counters as REAL tasks, REQUIRED Safe Person at activation — adults encouraged-not-required per D23, amends, service slot, replacement swap), **Just Today** (AI-free §8.4, daily UNIQUE, only-grows math), **the slip flow (§8.5 — the most carefully designed screen in the build: compassion → their own Bounce-Back words → kind math → pattern help only at scheduled check-ins)**, maintenance cadence, bridge-to-human panel (§8.7, faith-gated referrals — the one attribution carve-out) | Sonnet xhigh |
| B4 | **Teen Wheel (UNGATED, D10/D11) + teen/guided Overcoming BUILT DARK (ruling 14):** teen copy pack as sibling components per #196 (never in-place forks), parent-holds-a-support-role enforcement, gentled Spoke 3; **teen Overcoming (§8.6) + Guided Stop & Swap (mom-partnered, coloring-reveal chart via Build M verbatim) built COMPLETE behind `bigplans_overcoming_teen=false`** — teen door routes Wheel-only while dark; honest teen creation copy per §7.7 | Sonnet xhigh |
| B5 | **E2E B** (`tests/e2e/features/bigplans-wheel-overcoming.spec.ts`) — the privacy probes are load-bearing: adult interior BLOCKED from mom without grant / minor interior VISIBLE by default / grant flip notifies + label updates both ways / **kid cannot write the flag (RLS probe)** / existence+title always visible; slip-flow math (total never decreases, run resets silently, one row per day); no-alert probe (slip fires ZERO notifications); **crisis-override-independent-of-privacy probe**; DARK-GATE probes (teen/guided Overcoming unreachable with the key off; teen door shows no stop branch) + verification | Sonnet xhigh; gate **Fable-else-Opus** |

### BUILD C — Tiers & Integrations (after B; TRKG must be live for full C2 value)
| Slice | Scope | Routing |
|---|---|---|
| C1 | **Guided "My Goals" (§9.3):** dashboard section key `my_goals` (registered, mom-hideable, TransparencyIndicator), kid three-step wizard (Wish & Way lite; Haiku glaze via a dedicated small EF — #248 category-2, guided-nbt-glaze pattern), **draft → mom notification → mom review/co-edit → approve → deploy** (D9; honors #135), 7-day gentle mom nudge (§15), kid-warm waiting state, celebration kid-sized | Sonnet xhigh |
| C2 | **Kid-with-mom co-planning (§9.4):** mom-shell wizard + FO member-column entry, Haiku step proposals, Any/Each for multiple kids, reward pick: **Chart (tracker widget + TRKG tracker-goal→prize firing) / Coloring page (`member_coloring_reveals` linked via earning_task_id — Build M verbatim, zero new reward code) / Neither**; plan row member_id=kid, created_by=mom; Play kids see only tiles/chart/reveal | Sonnet xhigh |
| C3 | **Integrations (§12 — the waiting list wired):** Meetings bidirectional (MeetingPickerOverlay source='bigplans' + review-strip BigPlans destination), BookShelf ApplyThisSheet tile LIVE → NLC prefill, ThoughtSift "Make it a plan" chips, LifeLantern handoff + Wheel-suggestion (never auto-create), MindSweep adult 'plan' vocabulary, RoutingStrip + Notepad tile, Studio wizard tiles + capability_tags, rhythm registrations (check-in cards, support touchpoints, Just Today evening card), FO spot-check read-only plan cards | Sonnet xhigh |
| C4 | **E2E C + close-out:** tier probes (Guided draft-approval round trip incl. kid-cannot-deploy; co-plan chart/coloring round trips; Play surface-absence probe), integration round trips, STUB_REGISTRY sweep (the waiting-on list flips: Meetings Goals, BookShelf tile, ThoughtSift chips, #167 container, Daily-Progress Path I), registry corrections (SCOPE-3.F32/F13 closed), `ai_patterns.md` 7-mode amendment, LiLa knowledge + FeatureGuide, live_schema regen, verification tables | Sonnet xhigh; gate **Fable-else-Opus** |

## Dependency edges
- **TRKG FIRST** (ruled): C2's chart prize consumes tracker-goal firing; graceful degradation
  if TRKG slips (charts deploy, prizes light up later) but the order stands.
- SAFETY-BETA-GATE C→B→A: shipped 2026-07-04 per the addendum — worker RE-VERIFIES deployment
  at dispatch (shared prompt-site territory).
- `bigplans_overcoming_teen` flip: PRD-41 Layer 1 + PRD-30 live + explicit founder go (§14) —
  a one-key founder action, never part of these builds.
- Coordinate: GDCX (Guided section registry — `my_goals` joins it), RSTP (`useRewardProvenance`
  if both land near each other), PRD-12A (handoff producer — socket degrades gracefully),
  KIDS-REWARDS lineage discipline on any RPC this build touches.
- Unblocks on ship: Meetings Goals routing, BookShelf→BigPlans, ThoughtSift chips, Convention
  #167, School-Year-Planner Phase 3, Daily-Progress Path I, LifeLantern's consumer side.

## Open founder decisions
**None.** All 24 addendum decisions (§17) are founder-approved, including the three values
calls (D6 final, D9, D22-extended). The only future founder action is the
`bigplans_overcoming_teen` flip after the safety stack lands.

---

## DISPATCH PROMPT — BUILD A (paste into a FRESH session)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for BIGPLANS BUILD A — Foundation & Core Planning (the
flagship's first of three build phases). Pack: claude/dispatch-factory/PRD29.md (20 rulings +
the Build A slice table A1-A6 — your exact scope; Builds B/C are NOT yours). Evidence:
claude/dispatch-factory/PRD29-RECON.md.

FRESHNESS PREAMBLE: pack re-synthesized 2026-07-04. Run `git log --oneline --since=2026-07-04`
and read every CLAUDE.md convention added since; VERIFY SAFETY-BETA-GATE Slices C/B/A are
deployed (your prompt sites import buildSafetyPreamble); check whether TRKG/GDCX/RSTP landed
(coordination edges in the pack); re-verify the recon's file:line refs (drifted mode seeds,
pre-wired sockets); re-check the CORRECTED registries in audit/ + the §11 mode table; next
free migration number immediately before EVERY push (parallel sessions land migrations).

READ FIRST (in order — the pre-build ritual is mandatory):
1. prds/addenda/PRD-29-Goal-Science-Addendum.md — FULL, every word. It WINS over the base PRD.
2. prds/platform-complete/PRD-29-BigPlans.md — FULL (the surviving skeleton).
3. prds/addenda/PRD-29-Cross-PRD-Impact-Addendum.md + claude/feature-decisions/
   BigPlans-Goal-Science-Vision.md.
4. claude/dispatch-factory/PRD29.md + PRD29-RECON.md — the 20 rulings are LAW.
5. Create .claude/rules/current-builds/PRD-29-A-bigplans-foundation.md (no YAML frontmatter),
   full pre-build summary per claude/PRE_BUILD_PROCESS.md incl. the §5.6 friction-review
   answers, founder approval BEFORE code (Checkpoint 1).

BUILD SLICES A1→A6 per the pack table. HARD RULES: schema is GREENFIELD — bake every addendum
delta in from birth (plan_wheels/plan_support_people created here even though Build B wires
their surfaces; mom_granted_privacy RLS correct from day one); compile review deploys DIRECTLY
(#276); Haiku router / Sonnet conversations (§13 cost table is the contract); Horizon reframe
is a redirect never a gate (§4.2 verbatim; weight horizons default-off); +40% buffer VISIBLE;
"overdue" appears nowhere; sequential creation via #150 only; assignment via
useAssignableMembers + WITH CHECK; every DATE server-derived (#257); mode migration follows
the 100249 deactivation precedent and bases nothing on superseded bodies; tier keys through
the chart, zero hardcoded names; sidebar + full #16 mobile parity; white-hat copy rules (§15)
bind every surface; Lucide only; zero hardcoded colors + density (myaim-frontend-design skill).

PROOF: tests/e2e/features/bigplans-core.spec.ts per slice A6's list. tsc -b clean, lint clean,
regression pins green (leak-pass, permissions-wiring, task-assignment-scoping — ask the
founder before shared-fixture suites). NOTHING COMMITS until proof is green AND founder
eyes-on clears (eyes-on: she runs the "lose 15 lbs" conversation herself — the reframe must
feel like a gift, not a correction — and plans a real school year for one kid). Selective
staging; founder confirms before push. Close-out: Checkpoint 5 zero-Missing, live_schema
regen + DOMAIN_ORDER, baton-pass coordination note for Build B (what B consumes: schema,
modes, deploy pipeline, check-in machinery), archive build file.
```

## DISPATCH PROMPT — BUILD B (paste into a FRESH session — after Build A closes)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for BIGPLANS BUILD B — The Wheel & Overcoming. This is the
platform's deepest personal-work surface; the privacy and grace mechanics are the build. Pack:
claude/dispatch-factory/PRD29.md (rulings 12-17 are YOUR core law; slice table B1-B5). Build
A's close-out coordination note tells you what already exists (schema incl. plan_wheels/
plan_support_people, modes, deploy pipeline, check-ins).

FRESHNESS PREAMBLE: git log --oneline since Build A's close; re-read CLAUDE.md conventions
added since; verify Build A's Checkpoint 5 passed with zero Missing; re-verify the safety
preamble is on every prompt site you extend; next free migration number before every push.

READ FIRST: (1) prds/addenda/PRD-29-Goal-Science-Addendum.md §§7, 8, 10.2, 10.5, 14, 15, 17
(D6/D7/D10/D11/D12/D22/D23 rulings) — FULL, every word; (2) the pack + Build A's
feature-decision file; (3) the memory/manifest standing principle (no-hiding-from-parents —
the D6 mechanics are its sanctioned template: mom-held notified switch, never a kid lock).
Create .claude/rules/current-builds/PRD-29-B-wheel-overcoming.md, pre-build summary, founder
approval BEFORE code.

BUILD SLICES B1→B5. HARD RULES: the founder's Wheel framework is preserved VERBATIM — nothing
removed, additions only (§7.2 table is the checklist); Spoke-3 runs inside an explicit consent
container and essays default is_included_in_ai=FALSE, loading ONLY in Wheel-mode conversations
— outside the container they are never referenced (structural enforcement, not prompt-only);
mom_granted_privacy is writable by MOM ONLY (RLS-proven), every flip notifies the kid, the
state label renders in BOTH states; slip flow per §8.5 exactly — total-days never decreases,
run resets silently, NO alerts and NO opt-in alert toggle (D22-extended), pattern help only at
scheduled check-ins; Just Today is AI-FREE with a daily UNIQUE; Safe Person required at teen/
kid activation, encouraged for adults (D23); LiLa never labels or diagnoses — the user's own
words for the Hub, always; bridge-to-human panel with faith-gated referrals is the ONE
external-attribution carve-out; crisis override fires independent of every privacy state
(probe it); teen/guided Overcoming is built COMPLETE and shipped DARK behind
bigplans_overcoming_teen=false — the E2E must prove the dark surfaces are unreachable and the
teen door shows no stop branch; NO Wheel/Overcoming content ever enters Platform Intelligence;
teen variants are sibling components per #196, never in-place forks.

PROOF: tests/e2e/features/bigplans-wheel-overcoming.spec.ts per slice B5 — the privacy RLS
probes, the kid-cannot-write-the-flag probe, the no-alert probe, and the
crisis-independent-of-privacy probe are the load-bearing tests. tsc -b, lint, leak-pass pin.
Ask the founder before shared-fixture suites. NOTHING COMMITS until green AND founder eyes-on
clears (eyes-on: she builds a real Wheel of her own end-to-end — the Spoke-3 container must
feel safe, honest, and hers; and she flips privacy on a test kid's plan and watches the
notification + label from the kid's side). Selective staging; founder confirms before push.
Close-out: Checkpoint 5 zero-Missing, coordination note for Build C, archive.
```

## DISPATCH PROMPT — BUILD C (paste into a FRESH session — after Build B closes; TRKG live for full chart value)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for BIGPLANS BUILD C — Tiers & Integrations (the flagship's
final phase). Pack: claude/dispatch-factory/PRD29.md (slice table C1-C4; rulings 18-20 +
integration list §12). Builds A/B close-out notes tell you what exists.

FRESHNESS PREAMBLE: git log since Build B's close; re-read CLAUDE.md conventions added since;
VERIFY TRKG's build landed (C2's chart prize consumes tracker-goal firing — if absent, deploy
charts with the prize socket documented and tell the founder); check GDCX's Guided section
registry state (my_goals joins it — coordinate, don't collide); check PRD-12A state (handoff
socket degrades gracefully); next free migration number before every push.

READ FIRST: (1) prds/addenda/PRD-29-Goal-Science-Addendum.md §§9, 12, 15, 16 — FULL; (2) the
pack + both prior build files; (3) CLAUDE.md #135/#122-135 (Guided rules), #31 (expansion
cards n/a — this is real), Build M Conventions #211-214 (coloring reveals you consume
verbatim). Create .claude/rules/current-builds/PRD-29-C-tiers-integrations.md, pre-build
summary, founder approval BEFORE code.

BUILD SLICES C1→C4. HARD RULES: Guided kids NEVER deploy their own goals — draft → mom
approval → deploy (D9, #135; the kid-cannot-deploy probe is load-bearing); the kid wizard's
glaze is a dedicated small Haiku EF (#248 category-2, guided-nbt-glaze pattern — never a
lila_guided_modes row); co-planning consumes Build M coloring reveals and TRKG chart prizes
VERBATIM — zero new reward code (founder law); Play kids get tiles/chart/reveal only, no plan
surface; integration seeds route per #276 (direct where reviewed; studio_queue only
context-incomplete); MindSweep vocabulary is ADULT-only (#192 untouched); FO cards read-only;
all rhythm cards self-hide per the front-door rule (#168); mobile parity on anything
nav-reachable; white-hat copy rules everywhere.

PROOF: tests/e2e/features/bigplans-tiers-integrations.spec.ts per slice C4 + full regression
pins (fo-command-center, kids-rewards slices, leak-pass — you touch FO, Guided dashboard, and
reward surfaces; ask the founder before shared-fixture suites). NOTHING COMMITS until green
AND founder eyes-on clears (eyes-on: plan a goal WITH one of her Play/young-Guided kids on her
lap, pick the coloring-page reward, and watch the kid find it on their dashboard — that moment
IS the acceptance test; plus one Guided kid dreams a goal and she approves it from FO).
Selective staging; founder confirms before push. Close-out: Checkpoint 5 zero-Missing across
ALL THREE builds' verification tables, STUB_REGISTRY sweep (the full waiting-on list flips),
SCOPE-3.F32/F13 closed, ai_patterns.md 7-mode amendment, LiLa knowledge + FeatureGuide,
live_schema regen, archive all build files, and the founder's post-flagship review note
(anything deferred, anything discovered).
```
