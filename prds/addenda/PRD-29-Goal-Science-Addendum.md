# PRD-29 Goal Science Addendum

**Created:** 2026-07-04 (BIGPLANS-DESIGN session — research + design)
**Parent PRD:** PRD-29 (BigPlans)
**Status:** APPROVED 2026-07-04 (founder review, same day). **D6 approved WITH
AMENDMENT — final ruling:** minors' interiors VISIBLE TO MOM BY DEFAULT; mom may GRANT
a plan privacy; the kid always sees the current state and is notified on every flip
(encoded in §7.7, §8.6, §10.2, §11, §14, §15, §17). All other §17 decisions approved as
recommended (D22 extended: no opt-in slip alerts).
Canonical location: `prds/addenda/PRD-29-Goal-Science-Addendum.md`.
Next step: dispatch factory re-synthesizes the PRD29 pack against PRD-29 + this
addendum (TRKG sequences first).
**Authority chain:** `claude/feature-decisions/BigPlans-Goal-Science-Vision.md` (founder
direction, wins over everything) → this addendum → PRD-29 base → PRD-29 Cross-PRD Impact
Addendum. Where this addendum and the base PRD conflict, this addendum wins (newer-wins,
Convention #11). The dispatch pack's reconciliation rulings D-PRD29-1..5 are honored
throughout and restated where they interact with new design.

---

## §0 — How This Addendum Relates to PRD-29

PRD-29's skeleton **survives intact**: `plans` → `plan_milestones` → `plan_components` →
`plan_check_ins`, the Friction Detective four-category taxonomy, the compile → HITM review →
deploy pipeline, the three-tab Plan Detail, check-in rhythms, and trial periods all remain.
This addendum:

1. **Adds two peer goal classes** — identity change (**The Wheel**) and habit cessation
   (**Overcoming**) — as first-class plan types beside the project-class backbone.
2. **Re-architects intake** around six served intents (build/do, plan, complete,
   achieve-an-outcome, become, stop) entering through fewer visible doors, with blending —
   doors are framings, not silos.
3. **Grounds every flow in evidence** — the productized method set (§2) with research
   ranking in Appendix A.
4. **Specifies the outcome-goal reframe conversation** ("lose 15 lbs" → controllable
   commitments) as a first-class flow.
5. **Adds the Guided tier and the kid-with-mom co-planning tier** (base PRD had neither).
6. **Supplies the data-model deltas, permission changes, integration specs, AI cost model,
   and safety gates** for all of the above.

What this addendum deliberately does NOT do: rebuild reward machinery (coloring reveals,
tracker prizes, allowance — all consumed as-is per the Vision doc), build a meal engine
(§5.4), build a messaging channel for support people (seam only, §7.6), or spec the freebie
funnel (unchanged stub).

---

## §1 — The Six Intents and the Blend Principle (Architecture Frame)

Founder ruling (Vision doc, 2026-07-04): the doors are **intake framings, not
architecture**. Six intents must be SERVED:

| Intent | What it becomes structurally |
|---|---|
| **Build / do something** | Project-class plan (goal or project spine) |
| **Plan something** | Project-class plan where planning itself is the deliverable (execution commitment optional at save) |
| **Complete something** | Project-class plan seeded FROM an existing stalled effort (or a described half-done pile item) |
| **Achieve an outcome** | Any spine + the **Horizon reframe** (§4): controllable commitments + witnessed outcome |
| **Become someone** | **The Wheel** (becoming-class plan) |
| **Stop something** | **Overcoming** (overcoming-class plan — Wheel spine + recovery layer) |

**The blend principle, made concrete.** A real goal ("lose 15 lbs") is part project
(milestones), part system (habits/trackers), sometimes part overcoming (evening snacking),
sometimes part identity (become someone who moves daily). The architecture that serves this
without forcing a choice:

- Every plan has ONE structural **spine** (`plans.plan_type`, immutable — extended to five
  values: `goal`, `project`, `system`, `becoming`, `overcoming`).
- Any plan can carry **strands from the other classes**: habit components with When-Then
  cues, trackers, a witnessed Horizon, and — when the identity or cessation work is big
  enough to deserve its own structure — a **satellite plan** linked via
  `plans.parent_plan_id`.
- **One goal, one card.** The BigPlans main page shows only root plans (parent_plan_id IS
  NULL). Satellite strands render as sections INSIDE the parent's detail view, never as
  competing cards. Tapping the identity strand section opens the satellite Wheel's detail.
- LiLa composes across classes at intake: the user walks in through whichever door matches
  their words; the compile step may propose a primary plan plus satellite strands, each
  clearly labeled in the HITM review before anything persists.

This is the smallest architecture that honors "never force a goal into one door's shape":
one nullable column (`parent_plan_id`), a rendering rule, and compile-output support for
multi-plan proposals.

---

## §2 — The Productized Method Set (Research → Product)

Per the founder's direction, the research pass selected "a few methods" to productize,
ranked by strength of evidence × fit for a family platform. Full citations, effect sizes,
and disagreement flags are in **Appendix A**. Methods become platform concepts with warm
names — never author- or program-attributed anywhere in UI (naming glossary in §3).

### Tier 1 — Productize as core flows (strongest evidence, broadest fit)

1. **Mental contrasting + implementation intentions** (the WOOP/MCII family) →
   **"Wish & Way — the Four W's"** (§4.1). The single best-evidenced goal-pursuit
   intervention that fits a conversational product: meta-analytic effect of if-then
   planning on goal attainment is medium-to-large (d ≈ .65 across 94 tests, 8,000+
   participants), MCII adds the obstacle-contrast step and has RCT support **specifically
   in children and adolescents** (5th-grade academic RCT; adolescent self-discipline
   studies). This becomes the universal intake spine for goal-class plans across all four
   audience tiers.
2. **Progress monitoring made frequent, recorded, and seen** → check-in cards, trackers,
   visible plan progress (§6.4). Meta-analysis of 138 RCTs (N=19,951): prompting progress
   monitoring reliably increases attainment, and the effect is LARGER when progress is
   physically recorded and reported or made public. This is why BigPlans generates
   trackers and why check-ins exist — it is the evidence base for the whole
   "decomposition and check-in brain" premise.
3. **Accountability to a person** → the Wheel's support roles with **scheduled
   check-ins**, family plan check-ins, and progress-report framing (§7.4). Weekly progress
   reports to a friend produced the highest goal attainment in the Dominican goal study
   (~76% vs 43% think-only); the Cochrane-grade recovery literature (Appendix A.14) shows
   the same mechanism at maximum strength in peer-support programs.
4. **Backward planning + realistic buffering + pre-mortem** → the project-class flow
   (already PRD-29's backbone; enriched in §5). Planning-fallacy correction and
   obstacle pre-identification are retained and now share machinery with the Wall step of
   Wish & Way.

### Tier 2 — Productize as behaviors and defaults (strong evidence, targeted application)

5. **Process-over-outcome goal framing** → the **Horizon reframe** (§4.2). Sport-psych
   meta-analytic evidence: process goals (controllable actions) outperform outcome goals
   on both performance and psychological outcomes, and goal CONTROLLABILITY moderates
   everything. This is the founder's "lose 15 lbs" ruling with direct research backing.
6. **Fresh starts and shame-free recovery** → Fresh Reset (existing platform concept),
   **Bounce-Back Plans** (pre-written recovery protocols, §8.5), and fresh-start date
   suggestions (temporal landmarks measurably boost aspirational behavior). The
   abstinence-violation-effect literature is unambiguous: the shame spiral after a lapse —
   not the lapse itself — predicts full relapse; pre-planned, self-compassionate recovery
   breaks it. Celebration-only is efficacy, not just philosophy.
7. **Identity-first change** → The Wheel (§7), validated rather than invented: role models
   research (behavioral models / representing the possible / inspiration), possible-selves
   and identity-based motivation literature, and self-concordance findings (goals aligned
   with identity and values get more sustained effort). The founder's therapist framework
   maps cleanly onto all of it.
8. **Recovery principles** → Overcoming (§8): disclosure to a safe person (secrecy research:
   the burden is the mind returning to the secret; confiding relieves it), trigger and
   environment work (stimulus control — the most addressable friction), service (helping
   others is one of the strongest predictors of sustained recovery), one-day-at-a-time
   granularity, and — for children — **replacement behavior** (habit reversal training's
   competing response, the best-evidenced kid-appropriate technique in this space).

### Tier 3 — Design principles only (never user-facing mechanics)

- **Goal gradient + endowed progress** → progress bars start partially filled ("Plan made"
  counts), milestone proximity is visually emphasized. Never points, never variable-reward
  hooks (deliberate exclusion — see Appendix A.9 disagreement flag on the Hooked-model
  items in the condensed intelligence).
- **Goldilocks calibration** → LiLa right-sizes first commitments (start small, ~70%
  capacity, "worst day" test from the condensed intelligence).
- **Arrival fallacy** → completion ceremonies name who the person became, then offer
  maintenance mode — the finish line is never the whole story.
- **Habit-formation honesty** → LiLa never promises "21 days"; the 2024 meta-analysis
  median is ~2 months with enormous individual range (4–335 days). Check-in copy reflects
  patient timelines.

**What was researched and deliberately NOT productized:** streak-pressure mechanics
(black-hat motivation — burns out and shames), variable rewards in goal surfaces
(white-hat only ruling, §17 D20), public commitment beyond the family (out of scope for a
family platform), and loss-framed commitment devices (anti-shame DNA).

---

## §3 — Naming Glossary (Platform Concepts — No External Attribution)

Per the standing rule: methods become platform concepts. Research citations live in this
document only; the product never attributes. Proposed names (all reversible — §17 D3):

| Platform concept | What it is | Where it appears |
|---|---|---|
| **Wish & Way** (the Four W's: Wish → Win → Wall → Way) | The mental-contrasting + if-then-planning intake flow | Goal-class intake, guided kid wizard, teen flows |
| **When-Then Plan** | An implementation intention attached to a recurring commitment ("When I pour my morning coffee, then I practice French for 10 minutes") | Generated tasks/routines; optional field on any task |
| **Horizon** | A witnessed outcome (weight, a grade, revenue) — tracked as "what we noticed," never judged pass/fail | Outcome-reframe flow, plan detail, check-ins |
| **Commitments** | The controllable actions the user actually signs up for | Everywhere goals render |
| **Bounce-Back Plan** | The pre-written, self-compassionate recovery protocol authored at plan creation ("If I miss twice / if I slip: …") | All plan classes; central in Overcoming |
| **Just Today** | The one-day-at-a-time daily check-in surface for Overcoming | Overcoming plans, rhythm card |
| **The Wheel** | The founder's identity-change framework (Hub + 6 Spokes + Rim), preserved whole | Becoming-class plans |
| **Overcoming** | Wheel spine + recovery layer for stop-class goals | Overcoming-class plans |
| **Stop & Swap** | The Guided-kid overcoming frame: stop a behavior by swapping in a practiced replacement | Guided mom-partnered overcoming |
| **Fresh Reset** | Existing platform concept (Convention #69) — reused verbatim for goal recovery semantics | All habit components |
| **Friction Detective** | Existing PRD-29 concept — unchanged | System-class plans |

Door labels (§4.0) are plain-language sentences, not feature names. "BigPlans" remains the
feature name.

---

## §4 — Intake: Doors, Routing, and the Outcome Reframe

### §4.0 — Door presentation (recommended design)

The BigPlans main page "Start" surface has **one natural-language input as the primary
entry** (Composition Architecture, Convention #253) with **five door tiles** beneath it:

```
┌──────────────────────────────────────────────────────┐
│  What are you hoping for?                            │
│  ┌────────────────────────────────────────────────┐  │
│  │ Tell me in your own words…            [voice]  │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  …or start from what fits:                           │
│  ┌──────────────────┐  ┌──────────────────┐          │
│  │ Make something   │  │ Plan something   │          │
│  │ happen           │  │ out              │          │
│  └──────────────────┘  └──────────────────┘          │
│  ┌──────────────────┐  ┌──────────────────┐          │
│  │ Finish something │  │ Fix something    │          │
│  │ I started        │  │ that keeps       │          │
│  │                  │  │ breaking down    │          │
│  └──────────────────┘  └──────────────────┘          │
│  ┌──────────────────────────────────────────┐        │
│  │ Change something in me                   │        │
│  └──────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────┘
```

Routing per door:

| Door | Intent(s) served | What happens on tap |
|---|---|---|
| **Make something happen** | build/do, achieve-an-outcome | Wish & Way intake → goal or project spine (LiLa detects scale); outcome-detection runs (§4.2) |
| **Plan something out** | plan | Same intake, but compile marks the plan `planning_only` — value delivered before execution commitment; "Ready to start doing it?" converts later |
| **Finish something I started** | complete | Picker of existing paused/stalled/overdue-review plans PLUS free-text "it's not in here" → intake pre-seeded with "restart" framing (fresh-start date suggestion, obstacle question focuses on what stalled it last time) |
| **Fix something that keeps breaking down** | (system class) | Friction Detective conversation → system spine (unchanged from base PRD) |
| **Change something in me** | become, stop | One warm follow-up: "Is this more about growing something new in you, or leaving something behind?" → Wheel or Overcoming |

Rationale for five visible doors (not six, not three): each label is self-explanatory and
saves a routing conversation turn; merging become/stop into one door gives
**privacy-by-ambiguity** — a kid or teen tapping "Change something in me" on a shared
screen reveals nothing about whether they're growing or stopping something. The
achieve-an-outcome intent gets no door because outcome-detection runs on EVERY intake —
outcomes arrive phrased as things to do ("lose 15 lbs," "get an A in algebra") and are
caught by the classifier, not by self-selection. Alternatives in §17 D1.

**The NLC input is primary.** Whatever the user types is parsed (Haiku) for: intent class,
outcome-controllability, scale (task-sized → gentle redirect to Tasks; plan-sized →
proceed), and emotional register. Power users can name a type directly ("this is a system
design"). Per pack ruling D-PRD29-4: **routing/type-detection parse = Haiku; the planning
conversation itself = Sonnet.**

**Task-sized redirect (existing gap, now specified):** if the parse says this is a single
task ("call the dentist"), LiLa says so warmly and offers one-tap task creation instead —
"This one's small enough to just do — want me to add it to your Tasks?" No plan row
created.

### §4.1 — Wish & Way: the Four W's intake flow (goal-class spine)

The conversational core for goal-class intake, in order. LiLa runs it as conversation, not
a form (the manual wizard mirrors the same four steps as form fields — §5.6):

1. **WISH** — "What's the thing you're hoping for?" One sentence, the user's own words.
   LiLa reflects it back and (if fuzzy) helps sharpen to an essential intent — one clear
   sentence that resolves a thousand future decisions.
2. **WIN** — "Picture it done. What's the best thing about getting there?" The user
   vividly names the payoff — this is the mental-contrast anchor AND the plan's `why`,
   surfaced later at the "middle problem" moment when novelty is gone (LiLa quotes their
   own Win back to them at mid-plan check-ins).
3. **WALL** — "Now the honest part: what inside YOU or your normal week is most likely to
   get in the way?" Inner obstacle preferred (the research is specific: the obstacle
   should be the user's own — tiredness, phone, saying-yes-to-everything — not external
   forces they can't plan around). This doubles as the pre-mortem for project spines.
4. **WAY** — "When the Wall shows up, what will you do?" One or more **When-Then Plans**:
   "When [obstacle situation], then I will [action]." Plus the positive anchors: "When
   [existing daily moment], then [first commitment]."

Compile then proposes: title, description, Commitments (with When-Then cues), milestones
(if deadline-shaped — backward-planned with planning-fallacy buffer), trackers, and a
**Bounce-Back Plan** stub the user personalizes. Everything HITM per component, then
DIRECT deploy through the shared engine (Convention #276, pack ruling D-PRD29-2).

**Expectancy guard (research nuance, Appendix A.2):** mental contrasting helps when the
user believes success is possible; for low-confidence users it can backfire. If the intake
registers low expectancy ("I've failed at this a hundred times"), LiLa FIRST shrinks the
wish to a version the user rates as clearly doable ("what's the version of this you're
90% sure you could do for two weeks?") before running Wall/Way. Right-size, then contrast.

### §4.2 — The Outcome Reframe (Horizon flow) — first-class design

**Trigger:** the intake parse classifies the stated goal's controllability:

- **Controllable action** ("walk every morning," "read 20 books to the kids") → normal flow.
- **Outcome** — a result the user cannot directly will into being: body metrics (weight),
  grades, revenue/money results, another person's behavior ("get Gideon to practice
  piano"), external selections (win, get hired, get accepted) → reframe flow.
- **Mixed** ("finish the garage and keep it clean") → normal flow + habit strand.

**The reframe conversation (spec — the "lose 15 lbs" case, founder's example):**

> **User:** I want to lose 15 pounds.
>
> **LiLa:** That's a real wish, and I'm glad you said it out loud. Can I share something
> about goals like this one? The number on the scale is a RESULT — it isn't something you
> can directly do. What you CAN do is choose actions that tend to move it. So here's how
> we'll set this up so it actually works: we'll pick a few actions that are 100% yours to
> keep — those become your Commitments, and that's where all the credit lives. And the 15
> pounds becomes your **Horizon** — the thing we watch for on the way. We'll notice it
> together, but you'll never be graded on it. Sound fair?
>
> *(User agrees — or pushes back; if she insists on the number as the goal, LiLa honors it
> as the Horizon label and still builds Commitments underneath: the reframe is a redirect,
> never a lecture or a gate.)*
>
> **LiLa:** So — actions you control. Which of these feel like YOURS, or tell me your own:
> a daily walk or workout window · a food plan you'd actually enjoy · a kitchen-closes
> time in the evening · water before snacks · a weekly meal plan so dinner isn't a
> decision at 5pm?
>
> *(User picks/edits 2–3. LiLa runs Wall/Way on each — "what's most likely to break the
> evening one?" → When-Then plans. If the Wall for one commitment is itself a behavior to
> stop — "evening snacking is the whole battle for me" — LiLa offers the blend: "Want to
> give that one its own little Overcoming structure inside this plan? It gets a daily
> check-in and a swap plan." Satellite plan proposed at compile.)*
>
> **Compile proposes:** plan (spine: `goal`) titled from the COMMITMENTS, not the number
> — e.g., "Move Every Day & Eat With Intention" (user editable); Horizon = "15 lbs
> lighter" with optional witnessed tracker (weekly, self-reported, no target-line
> pressure rendering); Commitments as routines/tasks with When-Then cues; a habit tracker
> per commitment; meal-plan structures as LISTS (weekly meal ideas list + shopping list
> additions — §5.4 scope); optional satellite Overcoming plan for evening snacking;
> Bounce-Back Plan.

**Horizon rendering rules (non-negotiable grace mechanics):**
- The plan card progress bar reflects **Commitments kept**, never Horizon movement.
- Horizon appears in plan detail as "The Horizon: [text]" with a "what we've noticed"
  entry log — data points witnessed, no red/green judgment, no trend-line shaming. If the
  user linked a tracker, its data renders as observation ("You noted 212 this week").
- Check-in copy: "You kept 11 of 14 commitment days — that's the part that's yours. The
  horizon takes care of itself when the commitments stack. Anything you want to adjust?"
- Horizon tracking is OPTIONAL and default-off for weight specifically (§17 D13) — the
  commitments-only view is the default; the user opts into witnessing the number.

**Kid/teen variant:** same mechanic, simpler words. Teen "get an A in algebra" →
"the grade is the horizon; the commitments are yours: homework window, ask-one-question
rule, test-prep plan." For guided kids, mom mediates; outcome-goals from kids are almost
always reframed into practice commitments with a chart.

---

## §5 — Project Class: Full Design Pass (Equal Weight)

The project class is the branch families touch first and most often (founder ruling). The
base PRD's goal/project/system trio survives; this section enriches each flow with the
method set and closes the gaps the condensed intelligence named (budget, parallel
dependencies, seasonal timing).

### §5.1 — Goal spine enrichments (backward planning)

Base PRD behavior (establish goal + deadline → backward milestones → buffer → pre-mortem →
compile) is retained, with these amendments:

1. **Wish & Way replaces the bare "establish the goal" step** (§4.1). The Wall step IS the
   pre-mortem — one mechanism, two framings, no duplicate conversation.
2. **Planning-fallacy buffer is applied per-milestone, not just named.** Compile pads
   user-estimated durations by a default +40% (editable at review; LiLa says why in one
   warm sentence). Buffer is visible as "breathing room" in milestone dates, not hidden.
3. **Outcome-based milestones over date-based** where possible: compile prefers "porch
   furniture chosen and ordered" over "week 3." Dates attach to outcomes; slipping a date
   never marks the plan failed (Persist/Pause/Pivot at check-ins).
4. **First-week momentum design:** compile always proposes a first commitment achievable
   within 72 hours (endowed progress + goal gradient — the plan card ships with the
   "Plan made ✓" segment already filled and a near-term first win).
5. **Every recurring commitment gets an optional When-Then cue** written into the
   generated task/routine (§10.4 column).

### §5.2 — Project spine enrichments (parallel tracks)

Retained: named tracks, per-track milestones, cross-track `dependency_ids`, family
assignment. Amendments:

1. **Dependencies stay simple** (research note: household projects don't need critical-path
   math — the literature gap the condensed intelligence flagged is real, and the honest
   answer is that families need BLOCKING VISIBILITY, not Gantt science). The design keeps
   the base PRD's blocked-milestone indicator and adds one behavior: when a milestone
   completes, LiLa's next check-in names what it unblocked ("Permits approved — that frees
   up the Contractor track").
2. **Budget/resource dimension (named gap — closed with reuse):** `plans.budget_amount`
   (nullable target) + `plans.budget_list_id` → a linked `lists` row with
   `list_type='expenses'` (existing list machinery: amounts, categories, running total).
   Plan detail shows "Budget: $412 of $600" from the expenses list total. No new financial
   tables, no ledger involvement (allowance/financial_transactions untouched — Convention
   #225's spirit: plan budgets are NOT family financial data and never enter LiLa context
   as dollar details beyond the plan's own surface). Scope ruling §17 D15.
3. **Seasonal timing (named gap — partially closed):** compile detects season-bound
   projects ("before winter," "by the first day of school") and anchors backward planning
   to the seasonal boundary; check-ins within 3 weeks of a detected season boundary ask
   the transition question ("School starts in 2 weeks — does this plan survive the
   schedule change, or should we adjust now?"). The full seasonal-transition framework
   remains post-MVP (unchanged deferral).
4. **Family plans + assignment authority:** restated as law from pack ruling D-PRD29-5 —
   `bigplans_family_create` does NOT bypass `task_assignment` authority (Convention #276).
   Assignee pickers in milestone/task generation consume `useAssignableMembers()`; the DB
   WITH CHECK backstops. A dad creating a family plan can structure it fully but can only
   ASSIGN generated tasks to kids he holds the grant for.

### §5.3 — System spine (Friction Detective) — unchanged + one addition

The four-category taxonomy, diagnostic conversation, component blueprint, trial period,
and Persist/Pause/Pivot review are unchanged from the base PRD. One addition: the
diagnosis summary now explicitly checks the **structural-vs-personal** framing from the
friction research ("this is friction in the system, not failure in you" is already the
ethics guardrail; the addition is that the compile output's `solution_rationale` must name
which environmental/structural change carries the fix, so the deployed system leans on
environment design over willpower every time).

### §5.4 — Meal planning scope (founder flag, resolved)

Generated meal structures land in EXISTING surfaces only: a weekly meal-ideas list
(`lists`, `list_type='custom'` or the user's existing meal list), shopping-list additions
(existing shopping list machinery, including `include_in_shopping_mode`), and optional
calendar events for prep blocks. **No recipe engine, no nutrition data, no macro
tracking.** If the user asks for nutrition specifics, LiLa helps them phrase commitments
("a vegetable at dinner") rather than computing anything. Scope ruling §17 D14.

### §5.5 — Flagship: the Curriculum Planner (CREATE-a-curriculum)

The flagship family project type (founder ruling). BigPlans adds CREATE to the existing
PASTE path (`curriculum-parse` Edge Function, Convention #165 — dedicated function,
reused as-is for any pasted source material during the flow).

**Entry:** Studio outcome-named wizard tile ("Plan a School Year" — Convention #249
naming) + the "Plan something out" door + NLC ("I need to plan 4th grade for Mosiah").

**The wizard/conversation collects (every step skippable per Convention #250):**
1. **Who:** student(s) — one child, several, or a CO-OP group (co-op = the plan's scope
   includes non-family learners; see export below). Multi-student uses the Any/Each
   pattern's spirit: shared subjects vs per-student subjects.
2. **Frame:** school year dates (or term), weekly rhythm (4-day/5-day), target
   weekly-hours per subject if the family tracks hours (nullable — Convention #228's
   opt-in targets philosophy).
3. **Subjects:** picks from `homeschool_subjects` + creates new ones (writes to
   `homeschool_subjects` on deploy); per-subject: materials in hand (paste → curriculum-parse)
   or "help me shape it" (LiLa proposes a unit sequence from the goal — HITM).
4. **Goals per subject (optional):** "By May, Mosiah reads chapter books independently" —
   these become plan milestones with checkpoint semantics (merciful, §6.3).

**Deploy generates (all HITM at compile review, then direct-deploy):**
- One `plans` row (spine `project`; tracks = subjects).
- **Per-subject sequential collections** via the ONLY sanctioned path
  (`useCreateSequentialCollection` — Conventions #150/#152), items ordered, advancement
  modes per Build J (practice/mastery available per item).
- Milestones per subject goal, with `completion_rule` support for **pick-N-of-M**
  (Convention #167 lands HERE: "complete any 8 of these 12 nature-study units, these 2
  required" — the milestone completes when the rule is satisfied across its linked
  collection items; full spec §10.3).
- `homeschool_subjects` links so time logging (PRD-28, minutes-based) and the Log Learning
  widget attribute correctly; `tasks.counts_for_homework` + `homework_subject_ids` set on
  generated tasks where applicable.
- Compliance/portfolio feed: nothing new to build here — the plan's generated tasks and
  time logs ARE the evidence trail PRD-28B/PRD-37 consume; the addendum's only requirement
  is that generated artifacts carry `related_plan_id` so a future report can say "from the
  4th Grade Plan."
- Calendar events for term boundaries (optional).

**Co-op scope:** when the plan is marked co-op, outputs must be exportable/shareable:
**print/PDF outline** (subjects, sequences, milestone map — printable view, no new infra)
and **CSV of the unit sequence** for sharing outside the platform. No cross-family live
sharing (out of scope; §17 D16). Co-op student names beyond the family are free-text
labels on the plan, never `family_members` rows.

**Reuse-next-year:** sequential collections already support reassignment across years
(Convention #71); the plan itself supports duplication ("Copy for next year") which
deep-copies structure without completions — this generalizes the base PRD's post-MVP
"plan duplication" into MVP for the curriculum type only.

### §5.6 — Manual creation = Composition-compliant wizard (pack ruling D-PRD29-3, detailed)

Screen 6 of the base PRD is rebuilt as a wizard per Conventions #249–#256: outcome-named
entries on the Studio shelf ("Plan a Project," "Plan a School Year," "Build a Better
Routine," "Work on Something in Me"), every step skippable, save-and-return drafts
(`plans.is_draft`, Drafts page integration, "Save & Come Back"), per-field "Let AI help,"
bulk-AI-add on milestones/tracks/subjects/components, and NLC pre-population ("describe
your plan instead"). The wizard's four W's appear as four labeled fields with examples.
Friction-first design review answers (Convention #255) ship in the build file at dispatch.

---

## §6 — Check-Ins, Progress, and the Grace Layer (All Plan Classes)

### §6.1 — Check-in machinery (consolidated)

One check-in system serves every plan class, differentiated by `check_in_type`:

| check_in_type | Cadence | Surface | AI |
|---|---|---|---|
| `scheduled` | plan's check_in_rhythm (weekly/biweekly/monthly) | Rhythm card + Check In Now | Sonnet conversation (base PRD Screen 5) |
| `rim` | Wheel rim_interval_days (default 14) | Rhythm card + Wheel detail | Sonnet (full spoke walk) |
| `trial_review` | trial end (system plans) | Rhythm card + plan card indicator | Sonnet (Persist/Pause/Pivot) |
| `support_supporter` / `support_reminder` / `support_observer` / `support_parent` | per-role RRULE (§7.4) | Rhythm card ("Time to touch base with Sarah") + optional calendar event | None (it's a prompt to a HUMAN conversation) + optional 2-min log |
| `daily` | daily (Overcoming "Just Today") | Overcoming card / rhythm | None (pure UI; §8.4) |
| `slip_recovery` | on slip log | Overcoming flow | Sonnet optional ("want to talk it through?") |
| `season` | detected season boundary | inside `scheduled` check-in | — |

Check-in conversations always open with **endowed progress** ("You've kept 11 commitment
days and finished 2 milestones") before asking what's next, and at mid-plan they name the
**plateau** explicitly ("this is the boring middle where it feels like nothing's moving —
that's normal, and it's exactly where the becoming happens" — quoting the user's own Win
back to them).

### §6.2 — The 15-minute weekly family check-in (family plans)

Family plans default to a weekly 15-minute check-in rhythm card addressed to the plan's
members: are we on track, what needs to happen this week, do any dates need adjusting.
Renders as a shared rhythm card; completion writes one `plan_check_ins` row. This is the
condensed intelligence's weekly review pattern productized at family scope.

### §6.3 — Checkpoint dates are merciful everywhere (Wheel Spoke 2 generalized)

Every plan-level target date and milestone date is a CHECKPOINT, not a verdict. At a
checkpoint: celebrate what happened, then choose — done / continue (new date) / adjust /
archive without guilt ("Sometimes the season changes. You can always start again."). No
plan ever auto-fails. The word "overdue" appears nowhere in BigPlans UI; late milestones
render as "waiting for you" with the existing gentle pulse.

### §6.4 — Progress witnessing rules (the monitoring evidence, applied)

- Progress must be RECORDED, not just known: check-ins write rows; commitments tie to
  trackers/tasks with visible history; the plan card's bar moves on real events.
- Progress is SEEN: plan cards on the main page, rhythm cards, and (for family plans)
  the Family Overview column — the same data, surfaced where eyes already are.
- Progress is REPORTED to a person where one exists: support-role check-ins (§7.4) and
  family check-ins carry a one-line auto-drafted progress summary the user can edit
  before the conversation ("since you last talked: 9 practice days, 1 milestone").

### §6.5 — Bounce-Back Plans (never-miss-twice, productized)

Authored at plan creation (compile proposes a stub; user personalizes; HITM):

- **Trigger:** two consecutive misses on a recurring commitment (never the first miss —
  Fresh Reset covers day one with zero commentary), or a logged slip (Overcoming).
- **Behavior:** the NEXT surface the user touches for that plan shows the bounce-back
  card: their own pre-written words, a one-tap "shrink it" option (halve the commitment
  for a week), and "the plan needs adjusting, not you" framing with a one-tap check-in.
- **Never:** red banners, broken-streak imagery, guilt copy, or LiLa raising it uninvited
  in unrelated conversations.

### §6.6 — Completion & maintenance

On completion: celebration ceremony that names who they became (Guide's-Affirmation
pattern — "You're a person who plans a school year and ships it"), Victory via the
connector ONLY (fireDeed → victory_godmother; `plan_completed`/`milestone_completed`
CHECK values already exist — pack ruling 8), then the maintenance offer where it fits:
plans whose value persists (systems, Overcoming, habit-heavy goals) can enter
`status='maintenance'` — check-ins continue at a lower cadence, card moves to a quiet
"Keeping it going" section. §17 D21.

---

## §7 — The Wheel (Becoming-Class Plans)

**Founder law: nothing in the original framework is removed; additions are allowed.** The
full original (Hub + 6 Spokes + Rim, always-answers, both Spoke-3 essays, three support
roles with exact boundaries, evidence sources including the blind test, "I do what the
person I want to be would do") is preserved from the archived PRD-11 and adapted via the
Vision doc's concept mapping: Helm→LiLa guided mode · Keel→InnerWorkings
(`self_knowledge`) · Mast→Guiding Stars declarations · Compass tasks→`tasks` ·
Log→Journal · Crew→family members/Archives people · Rim scheduling→Universal Scheduler.

### §7.1 — Placement

The Wheel is BigPlans' method for identity-class goals: a plan with
`plan_type='becoming'`, wheel content in a 1:1 `plan_wheels` row (§10.2). It renders in
the shared BigPlans page/card system (one-card rule), with a Wheel-specific detail view
preserving the original's visual: Hub center, six spokes radiating, completed spokes
filled, Rim highlighted around the outside. Tabs stay Plan/Journal/Conversations —
the Wheel visual lives in the Plan tab.

Routing in: the "Change something in me" door → "growing something new" branch; LiLa
detection when a stated goal is a who-I-want-to-be ("I want to be more patient with the
kids" → "That sounds like it might be Wheel-sized — a real character change, not a task
list. Want me to show you how that works here?"). Wheels remain USER-initiated — LiLa
offers, never pushes (original rule preserved). Suggested concurrent load: 1–2 active
Wheels (original rule preserved).

### §7.2 — The framework, verbatim-preserved (summary for build reference)

| Element | Preserved content |
|---|---|
| **Hub** | The core change, aspirational framing ("what do I want to shift to become who I truly want to be"), refined until specific. Too-small changes get redirected to habits/tasks. |
| **Spoke 1 — Why** | Always-answer: "To increase self-worth and belonging for myself or others." Told upfront; the work is personalizing it. Faith integration §7.5. |
| **Spoke 2 — When** | Always-answer: "As soon as possible." Start date = when supports are in place; checkpoint date = merciful evaluation, never pass/fail. |
| **Spoke 3 — Self-inventory** | Two AI-compiled, user-edited essays: Part 1 honest assessment (genuinely uncomfortable by design — consent container §7.6), Part 2 vision with 2–4 role models (specific traits, not whole people). Both exportable (download/email). Preserved permanently. InnerWorkings data loaded for connections. Cross-app offers: Part-1 insights → InnerWorkings entries; Part-2 vision → Guiding Stars declarations. User decides; nothing moves automatically. |
| **Spoke 4 — Support people** | Three roles with exact boundaries: **Supporter** (cheerleader; spouse CAN), **Reminder** (permissioned slip-signal; spouse NEVER; kids can with pre-agreed playful signals; proximity to the change environment), **Observer** (watches and reports honestly when asked; spouse NEVER directly, but may share observations WITH the Observer). AI drafts approach scripts for each. AI serves supplementally in all three roles, always bridging to real humans. Imperfect person who exists beats perfect person who doesn't; missing roles never block progress. |
| **Spoke 5 — Evidence** | Defined upfront, reviewed at Rim: self-observation, observer feedback, **the blind test** (people who don't know notice — strongest evidence), plus fruits. LiLa's longitudinal reflection preserved ("three weeks ago… this week you caught yourself — that's real change"). |
| **Spoke 6 — Becoming** | Always-answer: "I do what the person I want to be would do." Real-time prompting in conversations. Actions become REAL tasks (required addition §7.3). |
| **Rim** | Periodic full-wheel check-in, default 14 days, user adjustable. Completion evaluation at checkpoint: complete / continue / adjust / archive without guilt. |

### §7.3 — Required addition 1: Spoke 6 plans into real tasks

Spoke 6 commitments become actual `tasks` rows (with When-Then cues where the commitment
is situational), created through the standard generation pipeline (HITM, direct deploy,
`related_plan_id` set, `source='project_planner'`). LiLa suggests; the user decides
(original rule) — but the PATH is now first-class instead of "can become Compass tasks."
Recurring becoming-practices may deploy as routine steps or tracker-linked habits; the
compile step offers the right primitive.

### §7.4 — Required addition 2: scheduled check-ins with each support person

The original scheduled only the Rim. Now **each support role gets its own scheduled
touchpoint**, stored on `plan_support_people` (§10.2) with an RRULE recurrence
(Universal Scheduler component, `showTimeDefault: false`), default suggestions:
Supporter monthly, Reminder none (their role is in-the-moment, but schedulable if
wanted), Observer every 2–4 weeks ("ask them what they've seen").

Mechanics: each due touchpoint surfaces as a rhythm-style card ("Time to check in with
your Observer — Sarah") with a one-line auto-drafted context ("since last time: 2 Rim
check-ins, 9 practice days"). Completing it writes a `plan_check_ins` row
(`check_in_type='support_observer'` etc.) with an optional 2-minute note ("what did they
say?") that feeds Spoke 5 evidence. Optional calendar event creation for people who want
it on the calendar. **No in-app messaging to the support person in this build** — the
seam for the future is `plan_support_people.nudge_permission BOOLEAN` (design the seam,
don't overbuild — Vision flag 2); if/when PRD-15 wiring arrives, permissioned Reminders
could receive scheduled prompts.

### §7.5 — Adaptation flag resolutions (Vision doc's six, resolved explicitly)

1. **Support-person storage:** hybrid — `plan_support_people` rows carry EXACTLY ONE of
   `family_member_id` (in-family), `out_of_nest_member_id` (adult kids/their spouses), or
   `free_text_name` (anyone else — a friend, a pastor, a coworker). Spouse-role
   constraints enforced in UI + validated at save when the person is a family member with
   a spousal relationship; free-text people can't be validated and get a gentle reminder
   of the role boundaries in the script LiLa drafts.
2. **Check-in scheduling:** §7.4. Rim scheduling moves to the Universal Scheduler
   (RRULE in `plan_wheels.rim_recurrence` mirroring `rim_interval_days`). Messaging seam
   designed, not built.
3. **Spoke-3 discomfort vs the context-reference tone rule:** they govern different
   things and coexist cleanly. The tone rule (feedback_context_reference_tone) governs
   LiLa referencing STORED context UNINVITED in ordinary conversations. Spoke 3 Part 1 is
   an INVITED, CONSENTED deep-dive inside an explicit container: LiLa states what's
   coming ("this next part is meant to be honest and a little uncomfortable — that
   discomfort is fuel, not punishment; ready?"), the user consents, can pause or step out
   at any time, and crisis override applies globally as always. OUTSIDE the Wheel
   container, essay content is never referenced uninvited — enforced structurally:
   Spoke-3 essays default `is_included_in_ai = FALSE` (deviation from the default-true
   convention, justified by the depth of the content; §17 D7) and load only inside
   Wheel-mode conversations for that plan. Adults only for the full-intensity version
   (§7.7).
4. **Faith language:** Spoke 1's belonging frame ("belonging to God, family, community,
   yourself") and any strength-beyond-your-own language integrate through
   `faith_preferences` — rich and specific for faith-active families (their tradition's
   vocabulary per preferences), universally warm otherwise ("something bigger than
   yourself — however you name that"). Never hardcoded. Same mechanism §8 uses.
5. **Teen Wheel: YES** (recommended; §17 D10). Adaptations: teen-language spokes; Spoke 3
   Part 1 GENTLED — an honest look, not the deliberate-discomfort deep-dive (no "this
   should hurt" framing; the adult intensity rule is adults-only); role models lean on
   people they know + characters; **a parent must hold one support role** (any of the
   three, respecting boundaries — or the dedicated `support_parent` role if the teen
   prefers a non-parent Reminder/Observer); visibility per the D6 final posture
   (§7.7: interior mom-visible by default, mom may grant privacy, state always shown to
   the teen; existence + Hub title always visible). Guided kids do NOT get Wheels (identity-change depth is developmentally wrong
   for the shell; their becoming-shaped wishes route to simple goals with practice
   commitments).
6. **Privacy:** §7.7.

### §7.6 — LiLa behavior notes (Wheel modes)

- One guided mode `bigplans_wheel` (Sonnet — deep mode, warranted and costed §13) runs
  Hub→Spoke 6 building, Rim check-ins, and in-container essay work. Incremental save per
  spoke (original behavior). Pause/resume anywhere.
- Always-answers are TOLD UPFRONT per spoke (original rule) — the frame is a gift, not a
  mystery.
- InnerWorkings connections in Spoke 3; Guiding Stars offers for Part-2 vision; Archives
  people (Crew) referenced for Spoke 4 candidates.
- In ordinary conversations, active-Wheel context loads as a one-line summary only
  ("working on patience — checkpoint May 12"), never essay content; Spoke-6 real-time
  prompting ("what would the mom you described do right now?") only when the USER brings
  the relevant situation up — growth/aspiration framing per the tone rule, never
  clinical labels.

### §7.7 — Wheel privacy (resolves flag 6; founder decision §17 D6)

- **Adults:** the plan's EXISTENCE (title, status, checkpoint) follows normal plan
  visibility — mom sees all plans' existence per mom-first architecture. The Wheel's
  INTERIOR — both essays, spoke contents, Rim notes — is **private to the owner by
  default**, including from mom when the owner is dad (precedent: dad's reflections,
  personal-rewards privacy grants, journal `is_private`). Owner can share any essay or
  the whole Wheel with their spouse explicitly (share toggle per artifact). Rationale:
  Spoke 3 Part 1 honesty collapses if the author is composing for an audience; the
  therapist-framework's power requires a private room. This is a deliberate,
  founder-decidable deviation from bare mom-sees-all.
- **Minors — the D6 FINAL posture (founder rulings 2026-07-04; the second amendment
  supersedes the first):** interiors are **VISIBLE TO MOM BY DEFAULT**, and **mom can
  GRANT PRIVACY** per plan — flipping the interior to just-the-kid's. The kid ALWAYS
  knows the current state: a persistent state label (TransparencyIndicator pattern)
  renders on the plan in BOTH states ("Mom can see this" / "Just yours — Mom made this
  private"), and a flip in EITHER direction notifies the kid. Never covert, either way.
  **Kids never hold the lock — mom does, in both directions:** privacy is hers to grant
  and hers to end, so no-hiding-from-parents is untouched (kids can't hide anything;
  they can only be GIVEN a private room). This mirrors the platform's personal-rewards
  privacy-grant precedent exactly (mom-sees-all default; mom may grant privacy).
  Plan EXISTENCE + Hub title remain always visible to mom regardless of the grant
  (for becoming/overcoming plans, `plans.title` initializes from the Hub text — the
  always-visible layer is the `plans` row; LiLa's shared-screen-dignity title suggestion
  applies). Teen creation copy states it honestly: "Mom can see this — big changes work
  better with your people beside you. If you'd like this space to be just yours, ask
  her: she can make it private, and you'll always see which it is."
  **This is a TEEN affordance:** Guided Overcoming (Stop & Swap) is mom-partnered by
  design — mom is co-creator and typically the Safe Person, in the room from the first
  session — so the privacy grant doesn't apply there; and Guided kids do not get Wheels
  at all (§7.5.5).
- Wheel essays are excluded from reports, aggregations, and spousal-transparency surfaces
  regardless of `is_included_in_ai` state.

---

## §8 — Overcoming (Stop-Class Plans)

Built ON the Wheel, not beside it (founder ruling): `plan_type='overcoming'` uses the
full Wheel spine plus a recovery layer. The recovery principles land exactly where the
Vision doc's table placed them; this section turns each into product behavior. Adult
version ships on the current safety stack (Layer 2 live); **teen/guided EXPOSURE gates on
PRD-41 Layer 1 + PRD-30 monitoring** (§14).

### §8.1 — What the recovery layer adds to the Wheel spine

| Principle | Product behavior |
|---|---|
| **Honesty — naming it without flinching** | The Hub, in the user's OWN words — LiLa never renames it clinically, never says "addiction/addict" (context-reference tone rule + founder hard boundary 2). Spoke 3 Part 1 serves the fearless inventory (adults full; teens gentled; kids none). |
| **Hope / strength beyond your own** | Spoke 1's belonging frame + `faith_preferences` integration (§7.5.4). For faith-active families this is rich and explicit; for others, universally warm. |
| **Telling someone safe (disclosure)** | Spoke 4 gains a REQUIRED role for overcoming plans: the **Safe Person** — the one human who knows. For kids this is A PARENT by design; for teens a parent is required in the support structure (Safe Person or another role); for adults, user's choice with LiLa encouraging a real human (secrecy research: the burden lives in the mind returning to the secret alone; confiding relieves it). The AI is NEVER the terminal disclosure point — processing partner, bridge to humans. |
| **Making things right (amends)** | New spoke-level section for overcoming Wheels (adult + teen only): a gentle list of {who, what would make it right, when}; items can become tasks. Kid version: at most one simple "make it right" action, mom-guided, optional. |
| **One day at a time** | The **Just Today** daily surface (§8.4). |
| **Trigger + environment work** | The **trigger map** (§8.3): when/where/what precedes the behavior → each trigger gets an environment change or a swap; environment changes become REAL tasks — and for kids, environment tasks are largely PARENT tasks (filters, device location, schedule changes) assigned to mom/dad, not the child. |
| **Daily maintenance after victory** | `status='maintenance'`: Just Today continues at the user's chosen lighter cadence; Rim drops to monthly. Never "graduated and gone." |
| **Service — helping someone else** | Spoke 6 gains a service slot: one recurring "help someone" commitment (family service counts — the platform's existing task/opportunity infrastructure carries it). Strong evidence: helping others is among the best predictors of sustained recovery. |
| **Relapse ≠ ruin** | The slip flow (§8.5) — the platform's most carefully designed shame-free interaction. |

### §8.2 — Overcoming intake (adult flow)

Door → "leaving something behind" branch → LiLa opens with normalization + agency:
"You're doing a brave thing just naming it. Here's how this works: we build it like a
Wheel — who you're becoming — because stopping something sticks when it's part of
becoming someone. And we add the daily layer, because this kind of change happens one
day at a time." Then: Hub (their words) → Spoke 1 (why/belonging) → trigger map (§8.3,
BEFORE the inventory — practical wins first) → Spoke 3 (full inventory, consented
container) → Spoke 4 incl. Safe Person → Spoke 5 evidence → Spoke 6 incl. replacement
behavior + service → Bounce-Back Plan (mandatory for overcoming) → Just Today cadence.
Compile → HITM → deploy (environment tasks, swap practice, trackers if wanted, support
schedules).

### §8.3 — The trigger map

`plan_wheels.trigger_map JSONB`: array of `{trigger_text, when_where, plan_type:
'environment_change' | 'swap' | 'exit_move', action_text, task_id}`. LiLa walks it
conversationally ("when does it usually happen? what's going on right before?"), then for
each trigger the user picks the counter: change the environment (remove/move/block —
becomes a task), swap (a competing response practiced whenever the urge arrives — the
habit-reversal evidence base; the swap is simple, physical, incompatible), or exit move
(pre-decided leave-the-situation action — a When-Then plan). Environment beats willpower
— LiLa says so plainly and pushes environment-first.

### §8.4 — Just Today (daily surface — deliberately AI-free)

A small card (Overcoming plan detail + optional rhythm card + optional dashboard widget):
today's date, the question "How did today go?" with two warm options — "Practiced it
today" / "Today was hard — log a slip", plus the swap reminder ("Your swap: squeeze the
prayer rock"). Counters shown: **days practiced (total)** — the headline number that only
ever grows — plus current run and best run rendered small. NEVER "streak lost," never a
zeroed headline (total-days framing is the anti-AVE display rule). Writes
`plan_check_ins` rows (`check_in_type='daily'`, server-derived date per Convention #257).
No AI call on this surface — cost and safety both (§13); a weekly Sonnet reflection is
offered inside the scheduled check-in instead. §17 D12.

### §8.5 — The slip flow (the most important screen in Overcoming)

Tapping "Today was hard — log a slip":
1. **Immediate compassion, zero commentary:** "Thank you for being honest — that took
   more strength than pretending. A slip is a page, not the book."
2. **Their own Bounce-Back Plan renders** — the words THEY wrote on a good day: name it
   without shame → tell my person → next right thing. One-tap actions: "Let [Safe Person]
   know it's a good time to talk" (renders THEIR OWN pre-agreed signal text to show/say —
   not an automated message in this build), "Do my swap now," "Talk it through with LiLa"
   (optional Sonnet `slip_recovery` conversation — processing partner framing,
   bridge-to-human always present, crisis override global).
3. **The display math stays kind:** days-practiced total unchanged (it never goes down);
   current run resets silently with no broken imagery; tomorrow's card is a fresh day
   (Fresh Reset).
4. **Pattern help, not pattern shame:** after 2+ slips sharing a logged trigger, the next
   SCHEDULED check-in (never the slip moment) offers trigger-map adjustment ("evenings
   keep showing up — want to strengthen the evening plan?").
Never: counters in red, guilt language, auto-notifying anyone (including mom for adults;
teen/kid visibility per §8.6 is ambient, not slip-alarm-driven), or LiLa raising the slip
uninvited later.

### §8.6 — Age tiers for Overcoming

**Adult:** full framework above. Privacy per §7.7 adults (interior private by default,
including slip logs; existence visible).

**Teen/Independent (EXPOSURE GATED on PRD-41 + PRD-30):** real framework, teen language.
Adaptations: gentled inventory (no deliberate-discomfort framing); parent REQUIRED in the
support structure — the design's strong default is parent-as-Safe-Person, and the intake
actively encourages the disclosure conversation with a drafted script ("telling your mom
or dad is the single strongest move in this whole plan — want help finding the words?");
amends gentle and optional; trigger map yes — with environment changes routed as parent
tasks where they need parent power (filters, device placement); Just Today + slip flow
identical in kindness. **Visibility (D6 final posture, §7.7):** the interior —
INCLUDING the slip log — is visible to mom BY DEFAULT; mom may GRANT the plan privacy
(the teen always sees the current state; every flip notifies them; the grant is mom's
in both directions). While visible, slip logs are AMBIENT only — they never fire alert
notifications, and per the founder's D22 ruling **no opt-in alert toggle is offered
either** (an available alarm recreates the pressure); a slip is met at the next human
conversation, not by a push. While privacy is granted, slips are not visible to mom.
**The global crisis override operates independently of the visibility state in all
cases** — crisis language in a slip note or conversation fires the override regardless
of the privacy grant; slips are not the safety pipeline. Safety monitoring (PRD-30, when built)
covers the LiLa conversations per its global scope.

**Guided kid — "Stop & Swap" (EXPOSURE GATED on PRD-41 + PRD-30; MOM-PARTNERED BY
DESIGN):** the kid never works this alone — sessions happen WITH mom (co-planning
pattern: mom's device or side-by-side; mom is in the room by design, which IS the
clinical best practice for children: parent involvement, shame removal, environment
change, replacement behavior, celebrated progress). Frame: "something I want to stop
doing" — never clinical, never scary. Structure (radically simplified — no Wheel visual,
no inventory, no amends list):
1. **Name it together** (kid's words, mom typing or kid typing with mom).
2. **The Swap** — pick the replacement together, practice it right then, twice, for fun.
3. **Helper jobs** — environment changes = MOM/DAD tasks (the kid sees "Mom's helping
   too" — the burden is shared, visibly).
4. **Just Today, kid-sized** — the practiced-days chart or a coloring reveal
   (`member_coloring_reveals` linked to the daily practice task — existing Build M
   machinery, zero new reward code).
5. **Slips:** "Oops days" logged together with mom, met with the family's pre-written
   kind words; the chart never loses stickers/color (earned progress is never taken away
   — Convention #219 applied verbatim).
Adult-content exposure cases specifically: the design assumes mom initiates after
discovery or disclosure; LiLa's role is structure + coaching MOM's response (calm,
non-shaming, connection-first — the evidence base is unambiguous that the parent's calm
response and open communication, not restriction alone, is what protects kids); the
kid-facing surface never names content categories, only the kid's chosen words.

### §8.7 — Bridge-to-human resource panel (all Overcoming tiers)

A persistent, quiet "More support" affordance on every Overcoming plan: professional
referral lines (therapist finder guidance), crisis resources (global override set), and
**faith-gated program referrals** via `faith_preferences` — e.g., LDS-identifying
families see the LDS Addiction Recovery Program as a referral card; other traditions get
their equivalents where known; secular alternatives always listed. Referrals may name
real external programs (the ONE carve-out to no-external-attribution); the in-app method
itself is never branded with program names. LiLa proactively bridges at natural moments
("a real group of people walking the same road is powerful — want to look at options?"),
and ALWAYS when severity signals exceed a processing-partner's lane (never diagnose;
"this deserves more support than an app — let's find it").

---

## §9 — Four Audience Tiers (Screen Specs)

### §9.1 — Adult (mom + dad — primary users)

Full surface. Amendments to the base PRD's six screens:

- **Screen 1 (main page):** unchanged card list + the §4.0 Start surface replacing the
  bare "Start New Plan" button. Sections: Active · Keeping It Going (maintenance) ·
  Paused · Drafts (Convention #250) · Completed (collapsed). Family Plans section above
  personal (unchanged). Sidebar entry ships with the build (+ full Convention #16 mobile
  parity check — pack ruling 11).
- **Screen 2 (plan card):** unchanged, plus: spine badge now includes Becoming/Overcoming
  types (Wheel plans show a small wheel glyph and spoke-completion count instead of
  milestone dots; Overcoming cards show days-practiced total — never run/streak — and
  NOTHING else revealing on the shared card face: title is the user's chosen title, which
  LiLa suggests keeping neutral for shared-screen dignity).
- **Screen 3 (detail):** unchanged three tabs; Plan tab gains: Horizon section (when
  present), Commitments section (When-Then cues visible), satellite-strand sections
  (§1), budget line (when present), Bounce-Back Plan (collapsed), support-people section
  with next touchpoints (Wheel/Overcoming). Wheel detail = spoke visual per §7.
- **Screen 4 (compile review):** unchanged HITM grid + per-component types extended
  (when_then cues editable inline; satellite plan proposals render as their own labeled
  group with an approve/reject on the whole strand). Direct deploy per #276.
- **Screen 5 (check-in):** unchanged + §6 behaviors.
- **Screen 6 (manual wizard):** §5.6.

### §9.2 — Teen / Independent

Own goals, real methods, absolute transparency. Surface = BigPlans page in Independent
shell (existing PRD ruling) with: goal + project spines (system-design still hidden —
household context; base PRD ruling stands), "Plan something out" + "Finish something"
doors, Wheel-teen (§7.5.5), Overcoming-teen (§8.6 — exposure gated; until the safety
stack lands, the "Change something in me" door in the teen shell routes ONLY to
Wheel-teen and shows a warm "growing" frame without the stop branch).
Teen-specific behaviors: age-appropriate copy pack (framing variants per the Phase-D
audience pattern — sibling components/copy, never in-place forks of adult components,
per Convention #196's principle); support structures include a parent (Wheel + Overcoming
rules); college-app / school-year project templates in the teen Studio shelf; check-in
cards ride the teen's existing rhythm surfaces ("Morning/Evening Check-in" naming per
Convention #190).
Plan existence and titles are always parent-visible. Wheel/Overcoming interiors follow
the D6 final posture (§7.7): mom-visible by default, mom may grant the plan privacy —
the teen UI states it honestly at creation ("Mom can see this — big changes work better
with your people beside you. If you'd like this space to be just yours, ask her: she
can make it private, and you'll always see which it is.").

### §9.3 — Guided ("My Goals" — NEW; base PRD had no Guided presence)

Founder: "Being able to create and track goals is something my independent and guided
kids especially need." Design:

- **Surface:** a simple "My Goals" section — a Guided dashboard section (registered
  section key, mom-hideable per the Guided section rules) showing 1–3 active goal cards
  (big progress visual, next step, celebration state) + a "Dream up a goal" button. No
  BigPlans page, no sidebar entry, no doors, no Wheel, no system design.
- **Creation — the kid three-step (Wish & Way lite, Haiku-glazed):**
  1. "What do you want to do?" (wish — text or voice)
  2. "Why will it be awesome?" (win)
  3. "What might make it hard — and what's your plan?" (wall/way — optional, skippable)
  A friendly generation proposes 3–5 small steps + an optional chart. **Then it saves as
  a DRAFT and mom gets a notification: "Ruthie dreamed up a goal!"** Mom reviews (FO
  member column or notification tap → co-edit in the co-planning surface §9.4), approves
  → structure deploys (tasks to the kid's dashboard, tracker if chosen). This honors
  Convention #135 (no Guided task creation) while giving the kid REAL authorship — the
  kid-facing waiting state is warm: "Mom's taking a look. Great dreaming!" §17 D9.
- **Tracking:** generated tasks are ordinary tasks on their dashboard (existing
  machinery: segments, gamification, allowance flags per mom's choices); goal card shows
  progress; completion fires the celebration ceremony kid-sized (+ Victory via connector).
- Everything mom-visible (TransparencyIndicator on the section per Guided conventions).

### §9.4 — Kid-with-mom co-planning (Play + young Guided)

Mom-driven from HER shell (and reachable from FO member columns): "Plan a goal with
[child]" wizard —
1. **The dream** (mom types the goal they dreamed up together; kid on her lap is the
   design image).
2. **The steps** (Haiku proposes 3–7 kid-sized steps; mom edits; Any/Each if multiple
   kids).
3. **The reward tracker** — mom picks: **Chart** (a tracker widget on the kid's
   dashboard; goal-threshold prize via the TRKG pack's tracker-goal→prize firing — this
   addendum CONSUMES that build, sequenced first per the manifest) or **Coloring page**
   (`member_coloring_reveals` linked to the goal's recurring practice task — existing
   Build M machinery verbatim: pick image, link task, step count) or **Neither** (tasks
   only).
4. **Deploy:** tasks to the kid's dashboard (assignment authority = mom's, trivially),
   tracker/reveal wired, plan row (`member_id` = the kid, `created_by` = mom) so mom's
   plan list and FO show it.
Play kids see only their tiles/chart/coloring reveal — no plan surface at all (base PRD
ruling stands: no BigPlans in Play shell).

---

## §10 — Data Model Deltas (Every Column, Every Enum)

### §10.1 — `plans` (deltas to the base PRD table)

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| member_id | UUID | | NOT NULL | **NEW.** FK → family_members. The plan's SUBJECT/owner (who it's for). Defaults to creator at insert for self-plans; = the kid for co-planned plans. Backbone for tier rendering + FO columns. |
| parent_plan_id | UUID | | NULL | **NEW.** FK → plans. Satellite strands (§1). Root plans have NULL; main page lists roots only. |
| plan_type | TEXT | | NOT NULL | **AMENDED CHECK:** 'goal','project','system','becoming','overcoming'. Still immutable. |
| status | TEXT | 'active' | NOT NULL | **AMENDED CHECK:** + 'maintenance' (and 'draft' is NOT a status — see is_draft). |
| is_draft | BOOLEAN | false | NOT NULL | **NEW** (Convention #250). Drafts invisible to other members, no deploys, Studio Drafts page. Guided-kid pending-mom-review goals are drafts. |
| planning_only | BOOLEAN | false | NOT NULL | **NEW.** "Plan something out" door — plan exists without execution commitment; conversion flips it. |
| wish_way | JSONB | | NULL | **NEW.** {wish, win, wall, way: [text]} — the Four W's, quoted back at check-ins. |
| horizon_text | TEXT | | NULL | **NEW.** The witnessed outcome, user's words. |
| horizon_tracker_widget_id | UUID | | NULL | **NEW.** FK → dashboard_widgets. Optional witnessed tracker. |
| bounce_back_plan | JSONB | | NULL | **NEW.** {steps: [text], shrink_option: text}. User-authored at creation. |
| budget_amount | NUMERIC(10,2) | | NULL | **NEW.** Optional budget target (§5.2.2). |
| budget_list_id | UUID | | NULL | **NEW.** FK → lists (expenses list). |
| source | TEXT | 'manual' | NOT NULL | **AMENDED CHECK:** 'manual','lila_conversation','lifelantern','wizard','nlc','mindsweep','bookshelf','thoughtsift','meeting','guided_kid','coplan'. |

All five existing DATE columns + any new date writes: server-derived per Convention #257
(trigger pattern; no client `todayLocalIso()` writes). `related_plan_id` FKs on `tasks` +
`journal_entries` land with this schema slice (pack ruling 10).

**RLS amendments:** personal plans readable by owner (member_id), creator, + mom.
Guided/co-planned kids can READ their own plan rows (their tier surfaces render from
them) but never UPDATE structure (mom-only, cross-sibling edit authority spirit —
Convention #266). Wheel/Overcoming interior privacy is enforced at the `plan_wheels`
layer (§10.2), not by hiding the plan row.

### §10.2 — `plan_wheels` (NEW — 1:1 with becoming/overcoming plans; also attachable as satellite)

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| plan_id | UUID | | NOT NULL | FK → plans, UNIQUE (1:1) |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members (owner — denormalized for RLS) |
| hub_text | TEXT | | NOT NULL | The core change, user's words |
| spoke_1_why | TEXT | | NULL | Self-worth/belonging personalization |
| spoke_2_start_date | DATE | | NULL | Server-derived writes (#257) |
| spoke_2_checkpoint_date | DATE | | NULL | Merciful checkpoint |
| spoke_2_notes | TEXT | | NULL | |
| spoke_3_who_i_am | TEXT | | NULL | Essay 1 (consented container; adults full / teens gentled / guided never) |
| spoke_3_who_i_want_to_be | TEXT | | NULL | Essay 2 (role models + vision) |
| spoke_3_role_models | JSONB | '[]' | NOT NULL | [{name, traits, notes}] |
| spoke_4_notes | TEXT | | NULL | (People live in plan_support_people) |
| spoke_5_evidence | JSONB | '[]' | NOT NULL | [{text, source:'self'/'observer'/'blind_test'/'fruit', seen, date_seen}] |
| spoke_6_becoming | JSONB | '[]' | NOT NULL | [{text, task_id}] — tasks are REAL (§7.3) |
| current_spoke | INTEGER | 0 | NOT NULL | 0=hub..7=complete |
| rim_interval_days | INTEGER | 14 | NOT NULL | |
| rim_recurrence | JSONB | | NULL | RRULE (Universal Scheduler #24) |
| next_rim_date | DATE | | NULL | |
| rim_count | INTEGER | 0 | NOT NULL | |
| essays_shared_with | UUID[] | '{}' | NOT NULL | Explicit share grants (adult privacy §7.7) |
| mom_granted_privacy | BOOLEAN | false | NOT NULL | **D6 FINAL:** the privacy GRANT for MINOR owners — default false = interior visible to mom. Mom-only write; the kid can NEVER modify it. Every flip (either direction) notifies the kid; a persistent state label (TransparencyIndicator pattern) renders on the plan in both states. Ignored for adult owners (adults use essays_shared_with). |
| privacy_changed_at | TIMESTAMPTZ | | NULL | Last flip (notification + state-label anchor) |
| is_included_in_ai | BOOLEAN | **false** | NOT NULL | DELIBERATE default-false deviation (§17 D7) — loads only in Wheel-mode conversations |
| trigger_map | JSONB | | NULL | Overcoming (§8.3): [{trigger_text, when_where, plan_type, action_text, task_id}] |
| amends | JSONB | | NULL | Overcoming, adult/teen: [{to_whom, what, status}] |
| replacement_swap | TEXT | | NULL | The competing response, plain words |
| safe_person_support_id | UUID | | NULL | FK → plan_support_people (required for overcoming at activation) |
| daily_checkin_enabled | BOOLEAN | true (overcoming) | NOT NULL | Just Today on/off |
| days_practiced_total | INTEGER | 0 | NOT NULL | The only-grows headline counter |
| current_run | INTEGER | 0 | NOT NULL | Rendered small; resets silently on slip |
| best_run | INTEGER | 0 | NOT NULL | Rendered small |
| created_at / updated_at | TIMESTAMPTZ | now() | NOT NULL | updated_at auto-trigger |

**RLS (per the D6 final §7.7 design):** owner full CRUD (except `mom_granted_privacy`,
which only mom writes). Adult owners: mom/spouse read requires an `essays_shared_with`
grant. Minor owners: mom read when `mom_granted_privacy = false` (the default); the
grant is always mom's to give and to end — never settable or blockable by the kid. Plan
existence + title always visible via the `plans` row regardless (for becoming/overcoming
plans, `plans.title` initializes from `hub_text`). Kid notification row written on every
flip; the persistent state label binds to the flag.

### §10.3 — `plan_milestones` (deltas)

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| completion_rule | JSONB | | NULL | **NEW** (Convention #167 lands): {mode:'all'} default, or {mode:'pick_n', n, source_type:'sequential_collection'/'list'/'tasks', source_id, required_item_ids:[]} — milestone completes when n of the source's items complete, requireds always. Evaluated on item-completion events. |

### §10.4 — `tasks` (delta — platform-wide affordance; §17 D8)

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| when_then_cue | TEXT | | NULL | **NEW.** The implementation-intention line ("When I pour my morning coffee…"). Rendered small under the title on task cards when present. Written by BigPlans generation; editable anywhere tasks are edited; available platform-wide. |

### §10.5 — `plan_support_people` (NEW)

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| plan_id | UUID | | NOT NULL | FK → plans |
| family_id | UUID | | NOT NULL | FK → families |
| role | TEXT | | NOT NULL | CHECK: 'supporter','reminder','observer','safe_person','parent_partner' |
| family_member_id | UUID | | NULL | Exactly one of these three set (CHECK) |
| out_of_nest_member_id | UUID | | NULL | FK → out_of_nest_members |
| free_text_name | TEXT | | NULL | Anyone outside the platform |
| relationship | TEXT | | NULL | |
| config | JSONB | '{}' | NOT NULL | Role-specific: {what_support_looks_like} / {signal, situations} / {what_to_watch} |
| script | TEXT | | NULL | LiLa-drafted approach script |
| check_in_recurrence | JSONB | | NULL | RRULE (Universal Scheduler) — §7.4 |
| next_check_in_date | DATE | | NULL | Server-derived |
| nudge_permission | BOOLEAN | false | NOT NULL | The messaging SEAM (§7.4) — unused this build |
| is_active | BOOLEAN | true | NOT NULL | Roles can be reassigned at Rim |
| created_at / updated_at | TIMESTAMPTZ | now() | NOT NULL | |

Spousal-boundary validation: when family_member_id resolves to the owner's spouse, role
CHECK at the app layer rejects 'reminder'/'observer' (UI never offers them; save-path
validates).

### §10.6 — `plan_check_ins` (deltas)

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| check_in_type | TEXT | 'scheduled' | NOT NULL | **NEW.** CHECK per §6.1 table: 'scheduled','rim','trial_review','support_supporter','support_reminder','support_observer','support_parent','daily','slip_recovery'. |
| support_person_id | UUID | | NULL | **NEW.** FK → plan_support_people (for support_* types). |
| check_in_date | DATE | | NOT NULL | **NEW.** Server-derived (#257) — daily idempotency key for 'daily' type (UNIQUE (plan_id, check_in_type, check_in_date) WHERE check_in_type='daily'). |
| outcome | TEXT | | NULL | **NEW.** For 'daily': 'practiced'/'slip'. For 'trial_review': 'persist'/'pause'/'pivot'. |

### §10.7 — Unchanged tables & scope corrections (restated)

`plan_components`, `friction_diagnosis_templates`, `freebie_friction_results`: unchanged.
`studio_queue.destination` + `best_intentions.source`: unconstrained TEXT — writer-code
only, no CHECK migrations (pack ruling 10). Victory writes: connector only (fireDeed →
victory_godmother; CHECK values already exist).

---

## §11 — Visibility & Permissions (Amended Matrix)

| Role | Access |
|---|---|
| **Mom / Primary Parent** | Full CRUD all plans (personal + family + kids'). Sees all plan EXISTENCE + titles. Wheel/Overcoming interiors of the OTHER ADULT: gated by share grant (§7.7, D6). MINORS' Wheel/Overcoming interiors: VISIBLE BY DEFAULT; mom may GRANT a plan privacy — kid always sees the current state, every flip notifies the kid, the grant is mom's in both directions (D6 final). Co-planning wizard. Approves Guided kids' goal drafts. |
| **Dad / Additional Adult** | Full CRUD own plans (incl. Wheel/Overcoming, interior private by default). Family plans per base PRD (`bigplans_family_create` grant; task assignment NEVER bypasses `task_assignment` authority — D-PRD29-5). Sees own + family plans + (if finance/kid grants exist, FO surfaces show kids' plan cards read-only per viewableLevels). |
| **Special Adult** | No BigPlans (unchanged). |
| **Independent (Teen)** | Own goal/project plans (full CRUD), Wheel-teen, Overcoming-teen (safety-gated exposure). No system-design (unchanged). No family-plan creation. Plan existence + titles always parent-visible; Wheel/Overcoming interiors follow the D6 final posture (§7.7): mom-visible by default, mom may grant privacy, state always shown to the teen, no kid lock. |
| **Guided** | "My Goals" dashboard section: create goal DRAFTS (mom approves), view + execute own deployed goals. No page, no Wheel, Stop & Swap only WITH mom (mom-partnered surface, safety-gated). |
| **Play** | No BigPlans surface. Co-planned outputs (tiles, chart, coloring reveal) only. |

Feature keys (all through the tier chart — Convention #256; beta returns true): existing
seven per the CORRECTED registry (plural `bigplans_check_ins`), plus **new:**
`bigplans_wheel`, `bigplans_overcoming`, `bigplans_overcoming_teen` (the safety-gate key —
also gates guided Stop & Swap), `bigplans_guided_goals`, `bigplans_coplan`,
`bigplans_curriculum`. Retire orphaned `bigplans_ai_compile` (pack ruling 11).

### Guided-mode registry (amends the CORRECTED registry's four rows)

| mode_key | Display Name | Model | Available To | Feature key | Notes |
|---|---|---|---|---|---|
| `bigplans` | BigPlans Planning | **Haiku parse → routes** | mom, adult, independent | bigplans_create | Router/type-detection only (D-PRD29-4) |
| `bigplans_goal` | BigPlans Goal Setting | Sonnet | mom, adult, independent | bigplans_create | Wish & Way + Horizon reframe live here |
| `bigplans_project` | BigPlans Project Planning | Sonnet | mom, adult, independent | bigplans_create | Incl. curriculum CREATE flow (matches CORRECTED registry + base-PRD Decision 18: teens get goal AND project; only system-design is hidden from teens) |
| `bigplans_system` | BigPlans System Design | Sonnet | mom (adult per base PRD) | bigplans_system_design | Unchanged |
| `bigplans_wheel` | The Wheel | Sonnet | mom, adult, independent | bigplans_wheel | Deep mode — building + Rim (§7.6) |
| `bigplans_overcoming` | Overcoming | Sonnet | mom, adult, independent* | bigplans_overcoming (+ _teen gate) | *teen exposure safety-gated (§14) |
| `bigplans_check_ins` | BigPlans Check-In | Sonnet | mom, adult, independent | bigplans_check_ins | Plural canonical (D-PRD29-1) |

Mode-taxonomy reconciliation (deactivate/migrate the five drifted seeds, reuse prose as
raw material) proceeds per pack ruling D-PRD29-1. Guided-kid goal creation and Just Today
are NOT LiLa modes (Haiku utility glaze + pure UI respectively — Convention #248
category-2 pattern; the kid wizard's glaze runs through a small dedicated endpoint like
guided-nbt-glaze).

---

## §12 — Integration Specs (The Waiting List, Wired)

1. **Meetings Goals routing (PRD-16):** two directions. (a) Plan → meeting: a "Talk about
   this together" action on family-plan check-ins creates a `meeting_agenda_items` row via
   the existing MeetingPickerOverlay (`source='bigplans'`). (b) Meeting → plan: the
   meeting review's routing strip gains a BigPlans destination — action items that are
   plan-sized deposit as NLC-prefilled plan seeds (`studio_queue` `destination='plan'`
   ONLY when context-incomplete per #276; otherwise open intake directly).
2. **BookShelf → BigPlans (PRD-23):** the ApplyThisSheet tile flips from `comingSoon` —
   "Turn this into a plan" sends the hearted extraction set as NLC prefill (source
   = 'bookshelf', source_reference_id = the item). Book wisdom in planning conversations
   (RAG) remains the base PRD's dependency-gated stub.
3. **ThoughtSift chips (PRD-34):** Decision Guide resolutions and Board of Directors
   syntheses gain a "Make it a plan" chip → NLC prefill (source='thoughtsift').
4. **LifeLantern handoff (PRD-12A):** unchanged mechanics (complex multi-step goal →
   `studio_queue` source='goal_decomposition', destination='plan') — now landing on the
   §4 intake with the LifeLantern area as context. Additionally: LifeLantern-shaped
   identity gaps route a SUGGESTION toward the Wheel ("this sounds like who-you-want-
   to-be work"), never auto-create.
5. **Convention #167 pick-N-of-M containers:** land as `plan_milestones.completion_rule`
   (§10.3) + curriculum flagship usage (§5.5). `curriculum-parse`'s
   `detected_metadata.pick_n_of_m` finally has a consumer.
6. **MindSweep (PRD-17B):** `mindsweep-sort` gains 'plan'/configuration-worthy detection
   (Convention #254) → proposes a Natural-Language-Composition flow landing in Drafts;
   mom approves the proposal, never auto-routed. ADULT vocabulary only — Convention
   #192's teen disposition list is NOT extended (pack ruling 9).
7. **Rhythms (PRD-18):** check-in cards per the existing Cross-PRD addendum
   (`bigplans_checkin_{plan_id}`), extended with: support-touchpoint cards, Just Today
   (Overcoming) as an optional evening-rhythm card, and the weekly family-plan check-in
   card.
8. **Victories (PRD-11):** connector-only (fireDeed → victory_godmother) for
   plan_completed / milestone_completed + Overcoming checkpoint celebrations. HITM
   suggestion semantics per the base addendum.
9. **Trackers (PRD-10 + TRKG pack):** BigPlans GENERATES tracker widgets (existing
   machinery) and CONSUMES tracker-goal→prize firing (TRKG — sequenced before this
   build). Chart-reward co-planning (§9.4) depends on TRKG for the prize moment; if TRKG
   slips, charts still deploy (prize firing lights up when TRKG lands).
10. **Coloring reveals (Build M):** consumed verbatim — reveal linked to a goal's
    practice task via `earning_task_id`. Zero new reward code (founder law).
11. **Homeschool (PRD-28/28B/37):** §5.5 — subjects links, counts_for_homework flags,
    related_plan_id on generated artifacts as the evidence-trail thread.
12. **Smart Notepad / RoutingStrip (PRD-08):** BigPlans destination tile ships (base
    addendum spec) — deposits NLC-prefilled plan seeds.
13. **Studio (PRD-09A/B):** outcome-named wizard tiles on the shelf ("Plan a Project,"
    "Plan a School Year," "Build a Better Routine," "Work on Something in Me"), Drafts
    page integration, capability_tags on all new templates.
14. **FO command center:** kids' plan cards render read-only in member spot-check
    (post-MVP nice-to-have: a Plans section key in FO columns — flagged, not required
    for this build).

---

## §13 — AI Cost Model

Per model-routing policy + Convention on cost ceilings (<$1/family/month total AI).
Prices assumed at current OpenRouter Sonnet/Haiku rates; all generation Haiku unless a
deep conversation genuinely warrants Sonnet — and the Wheel/Overcoming conversations DO
(founder brief: "say so explicitly and cost it").

| Surface | Model | Est. tokens/use | Est. cost/use | Expected monthly use (active family) | Monthly |
|---|---|---|---|---|---|
| Intake parse (door/type/controllability/scale) | Haiku | ~1.5k | ~$0.002 | 6 | $0.01 |
| Planning conversations (goal/project/system) | Sonnet | ~25k conv total | ~$0.09 | 2 new plans | $0.18 |
| Compile (all types) | Sonnet | ~8k | ~$0.03 | 2 | $0.06 |
| Scheduled check-in conversations | Sonnet | ~10k | ~$0.04 | 4 | $0.16 |
| Check-in card glaze (one-liners) | Haiku | ~0.8k | ~$0.001 | 12 | $0.01 |
| Wheel building (spread over sessions) | Sonnet | ~60k total | ~$0.22 | 0.3 (one Wheel ≈ every 3 mo) | $0.07 |
| Rim check-ins | Sonnet | ~12k | ~$0.045 | 2 | $0.09 |
| Essay compiles (2 per Wheel) | Sonnet | ~10k | ~$0.04 | 0.6 | $0.02 |
| Overcoming slip-recovery talks (optional) | Sonnet | ~8k | ~$0.03 | 2 | $0.06 |
| Just Today daily check-in | **none** | 0 | $0 | 30 | $0 |
| Guided kid wizard glaze | Haiku | ~2k | ~$0.003 | 3 | $0.01 |
| Co-planning step generation | Haiku | ~2k | ~$0.003 | 2 | $0.01 |
| Curriculum CREATE (heavy, seasonal) | Sonnet | ~40k | ~$0.15 | 0.2 (≈2/school-year) | $0.03 |
| **Total (heavy-usage month)** | | | | | **≈ $0.70** |

Notes: (a) a typical month is far below this — planning is episodic; the table models an
unusually active month; (b) the all-Sonnet base-PRD spec is corrected per D-PRD29-4
(Haiku router + glaze + kid flows); (c) the ONLY daily surface (Just Today) is
deliberately AI-free, which is what keeps Overcoming affordable at daily granularity;
(d) embeddings for friction detection ride the existing async pipeline (negligible).

---

## §14 — Safety Sequencing Note (Restated as a Gate)

- **Adult surfaces (all classes, incl. Overcoming):** ship on the current stack — Layer 2
  (safety preamble in every prompt site, SAFETY-BETA-GATE Slices C→B→A shipped 2026-07-04)
  + global crisis override. The `bigplans_wheel` and `bigplans_overcoming` prompts import
  `buildSafetyPreamble()` like every other prompt site, plus mode-specific guardrails:
  never diagnose/label, bridge-to-human triggers, Spoke-3 consent container, mediator-
  style persistence of any safety escalation state in `context_snapshot`.
- **Teen Overcoming + Guided Stop & Swap:** DESIGNED NOW (this addendum), **EXPOSURE
  GATED** on PRD-41 Layer 1 (output validation) + PRD-30 (safety monitoring) both live —
  the most sensitive planned LiLa surface, per the Vision doc. Gate key:
  `bigplans_overcoming_teen` stays OFF until the founder flips it post-safety-stack.
  Teen Wheel (becoming) is NOT gated (no cessation content; standard Layer-2 posture) —
  founder can tighten this in D11 if she prefers both gated.
- Kid/teen Overcoming conversations are monitored-by-default surfaces under PRD-30's
  child-monitoring scope when it lands; the design carries no exemptions.
- Crisis override global in every mode; Safe Harbor exemptions do not apply here (these
  are NOT Safe Harbor surfaces; standard aggregation rules with §7.7's privacy layers).
- **Crisis override is independent of every visibility state** (D6 final + D22
  ruling): mom's privacy grants, adult share grants, and slip-log ambient visibility
  have ZERO bearing on safety escalation — crisis language anywhere (including slip
  notes) fires the global override regardless. Slips are not the safety pipeline;
  the safety pipeline never waits on a privacy toggle.

---

## §15 — Empty States, Edge Cases, and Copy Rules

**Empty states (celebration-only voice):**
- Main page, no plans: base PRD copy stands, extended: "…or someone you're becoming, or
  something you're ready to leave behind. This is where it takes shape."
- Guided My Goals, empty: "What's something you'd love to do? Dream one up — Mom will
  help you build it."
- Wheel, no support people yet: "Nobody in a role yet — that's okay. An imperfect
  someone beats a perfect no one. Want help thinking of a person?"
- Overcoming, day 1: "Day one is the bravest day. Just today — that's the whole job."
- Drafts, empty: standard Drafts-page copy (Convention #250 surfaces).

**Edge cases (beyond the base PRD's, all of which stand):**
- Outcome-goal user REJECTS the reframe twice → LiLa builds it their way (Horizon titled
  as they insist), commitments still generated underneath; never a gate, never a lecture.
- Satellite plan completed while parent active → parent detail celebrates the strand;
  card unaffected. Parent archived → satellites prompt: keep standalone (promote to
  root) or archive together.
- Guided kid's draft goal sits unreviewed 7 days → gentle mom nudge in HER notification
  stream ("Ruthie's goal is waiting for you"); kid-side stays warm, never "mom hasn't…".
- Teen turns 18 / graduates shells mid-plan → plans follow the member; visibility
  relaxes to adult rules at role change (existing role-transition machinery):
  `mom_granted_privacy` becomes inert and adult share-grant rules take over (interiors
  default private per the adult posture).
- Mom grants (or ends) privacy on a minor's plan → kid notified immediately on every
  flip; the persistent state label updates ("Mom can see this" / "Just yours — Mom made
  this private"). The state is never covert in either direction; the kid can never
  modify the grant.
- Crisis language in a slip note while privacy is granted → global crisis override
  fires exactly as it would anywhere else (§14); the privacy grant is irrelevant to
  safety.
- Overcoming owner deletes the plan → soft archive; `plan_wheels` content retained per
  standard soft-delete; export offered first ("your story is yours — download it?").
- Slip logged twice same day → one row per day (UNIQUE constraint); second tap updates
  outcome, copy stays kind.
- Support person is removed from family (member deleted / out-of-nest changes) → role
  flagged inactive, Rim prompts a reassignment; nothing breaks.
- Wheel checkpoint arrives with zero evidence seen → merciful evaluation per original:
  celebrate any progress, recalibrate, "not there yet" is a valid, shame-free outcome.
- Same-titled duplicate active plan detected at compile → LiLa asks merge/keep-both
  (mirror of routine-overlap warm path).
- `bigplans_family_create` dad without task_assignment grant for a kid → assignment
  picker simply doesn't offer that kid (born-scoped `useAssignableMembers()`); WITH CHECK
  backstops; no error theater.

**Copy rules (bind all BigPlans surfaces):** no "overdue," no red states, no streak-loss
imagery, no "you failed/missed" voice — the system frames every gap as the PLAN needing
adjustment; identity-connected celebration ("you're a person who…") over generic praise;
Lucide icons only; no external attribution anywhere (methods are platform concepts);
user's own words for Hubs and Overcoming subjects, always.

---

## §16 — Cross-PRD Impact Summary (Delta to the Existing Cross-PRD Addendum)

| PRD | New/changed impact |
|---|---|
| PRD-05 | Mode registry per §11 (7 modes; Haiku router; two new deep modes). Safety preamble import obligatory. Active-plans context block unchanged + one-line Wheel summaries (never essays). |
| PRD-06 | Unchanged (+ Spoke-3 Part-2 → Guiding Stars offers). |
| PRD-08 | Unchanged (related_plan_id, RoutingStrip tile). |
| PRD-09A | when_then_cue column on tasks (§10.4, D8). Sequential creation via #150 path only. |
| PRD-10 + TRKG | BigPlans consumes tracker-goal firing; sequencing: TRKG first. |
| PRD-11 | Connector-only victory writes (restated). |
| PRD-12A | Handoff unchanged + Wheel-suggestion behavior. |
| PRD-15 | SEAM ONLY: plan_support_people.nudge_permission for future scheduled prompts. Nothing built. |
| PRD-16 | Bidirectional Goals routing (§12.1). |
| PRD-17/17B | destination='plan' writer code; MindSweep adult 'plan' vocabulary (#254; #192 untouched). |
| PRD-18 | Check-in cards + support-touchpoint cards + Just Today evening card. |
| PRD-23 | ApplyThisSheet tile live → NLC prefill. |
| PRD-24/26 (Build M) | Coloring reveals consumed verbatim for co-planning + Stop & Swap charts. |
| PRD-28/28B/37 | Curriculum flagship links (§5.5). |
| PRD-30 / PRD-41 | Exposure gates (§14). |
| PRD-25 (Guided) | NEW dashboard section key `my_goals` (mom-hideable; joins the Guided section registry). |
| PRD-14C (FO) | Kids' plan cards in spot-check read-only; optional future FO section key. |
| PRD-34 | Route-to-BigPlans chips. |
| PRD-35 | Rim + support-role recurrences via Universal Scheduler. |
| Platform Intelligence | System-design patterns channel unchanged; NO Wheel/Overcoming content ever enters PI capture (hard exclusion — deeply personal). |

---

## §17 — FOUNDER DECISION LIST

Every judgment call made in this addendum that Tenise should be able to reverse.
Recommendations first; nothing here is silently final.

> **FOUNDER REVIEW 2026-07-04 — ALL 24 DECISIONS APPROVED as recommended**, with explicit
> sign-off on the three values calls (D6, D9, D22) and ONE amendment:
> - **D6 AMENDED — FINAL RULING (second same-day founder clarification supersedes the
>   first amendment's direction):** adults as drafted (interiors private unless
>   explicitly shared with spouse; existence/titles visible). **Minors: interiors
>   VISIBLE TO MOM BY DEFAULT; mom has the ability to GRANT a plan privacy.** The kid
>   always knows whether the plan is visible or private (persistent state label in both
>   states — TransparencyIndicator pattern), every flip notifies the kid, and the grant
>   is mom's in both directions — kids never hold a lock, so no-hiding-from-parents is
>   untouched. Existence + Hub title always visible regardless. Teen affordance only —
>   Guided Overcoming stays mom-partnered by design (mom is co-creator/Safe Person; the
>   grant doesn't apply). Mirrors the personal-rewards privacy-grant precedent
>   (mom-sees-all default; mom may grant privacy). Encoded: §7.7, §8.6, §10.2, §11,
>   §14, §15.
> - **D9 approved:** draft → mom approval → deploy for Guided kids.
> - **D22 approved AND EXTENDED:** ambient visibility, NO slip alerts, and **no opt-in
>   alert toggle offered either** — an available alarm recreates the pressure. Crisis
>   language in any slip note fires the global crisis override independently; slips are
>   not the safety pipeline. Encoded: §8.6, §14, §15.

| # | Decision made in this draft | Recommendation & alternatives |
|---|---|---|
| **D1** | **Five visible doors + NLC-primary intake** (§4.0): Make something happen · Plan something out · Finish something I started · Fix something that keeps breaking down · Change something in me | **REC: keep five.** Alt A: three doors (Accomplish / Fix / Change) + one routing question each — cleaner page, one more conversation turn. Alt B: six doors (split become/stop) — loses privacy-by-ambiguity (see D2). |
| **D2** | Become + stop share one door ("Change something in me") so tapping it reveals nothing on a shared screen | **REC: yes.** Reverse only if discoverability of Overcoming matters more than glance-privacy. |
| **D3** | Naming set: **Wish & Way** (Wish→Win→Wall→Way), **When-Then Plan**, **Horizon**, **Commitments**, **Bounce-Back Plan**, **Just Today**, **Stop & Swap** | All renameable at zero design cost. Alternates considered: "Dream & Bridge" (Wish & Way), "North Star" (Horizon — rejected: collides with GuidingStars), "Oops Plan" (Bounce-Back — rejected: cutesy for adults). |
| **D4** | `plans.member_id` (plan subject) + `parent_plan_id` satellite architecture; **one goal, one card** rendering rule (§1) | **REC: yes** — smallest schema honoring the blend principle. Alt: layers-on-one-row (JSONB strands) — fewer rows, much hairier queries and permissions. |
| **D5** | **Wheels ARE plans** (`plan_type='becoming'/'overcoming'` + 1:1 `plan_wheels`), one page, one check-in machinery | **REC: yes** — one landscape as you envisioned ("one path in the BigPlans landscape"). Alt: separate Wheel feature/page — cleaner privacy story, but fragments the landscape and duplicates check-in plumbing. |
| **D6** | **APPROVED — FINAL RULING (2026-07-04, second amendment)** — Adults: interiors private by default, explicit spouse share grants, existence/titles visible (as drafted). Minors: interiors **VISIBLE TO MOM BY DEFAULT; mom may GRANT a plan privacy** — the kid always sees whether it's visible or private (persistent label, both states), every flip notifies the kid, the grant is mom's in both directions, existence + Hub title always visible. Teen affordance only — Guided is mom-partnered by design. (§7.7) | Adult rationale as drafted (Spoke-3 honesty dies with an audience; dad's-reflections precedent). Minor posture mirrors the personal-rewards privacy-grant pattern: mom-sees-all default, privacy as a gift mom can give — kids never hold a lock, so no-hiding-from-parents is untouched. |
| **D7** | Wheel essays default `is_included_in_ai = FALSE` (deviation from Convention #8's default-true), loaded only inside Wheel-mode conversations | **REC: yes** — depth + privacy. Alt: default true with Layer-2-only relevance loading (standard pattern, more LiLa "knowing," higher surprise risk). |
| **D8** | New `tasks.when_then_cue TEXT` column — implementation-intention line on ANY task, platform-wide (§10.4) | **REC: yes** — the single best-evidenced micro-feature in the whole research pass, useful far beyond BigPlans. Alt: keep cues inside plan JSONB only (no tasks migration, no platform-wide benefit). |
| **D9** | Guided kid goal creation = **draft → mom approval → deploy** (§9.3), honoring Convention #135 | **REC: yes.** Alt: kid-direct-create with mom notification — faster joy, but breaks the no-Guided-task-creation convention and mom's curation. |
| **D10** | **Teens get the Wheel** — gentled Spoke-3 (no deliberate-discomfort framing), parent holds a support role, full parent visibility | **REC: yes.** Alt: adult-only Wheel (teens lose the strongest identity tool right at identity-formation age). |
| **D11** | Teen **Wheel** ships ungated; only teen/guided **Overcoming** exposure gates on PRD-41+PRD-30 (§14) | **REC: as drafted.** Tighten to "both gated" if you want maximum caution on teen deep-work surfaces. |
| **D12** | **Just Today is AI-free** (pure UI daily check-in; optional weekly Sonnet reflection) (§8.4) | **REC: yes** — cost + safety + speed. Alt: Haiku one-liner glaze per day (≈$0.03/mo/plan, adds warmth, adds a daily AI surface to a sensitive flow). |
| **D13** | Horizon tracking optional; **default OFF for body-weight horizons** specifically (§4.2) | **REC: yes** — weight-tracking pressure is the classic shame vector. Alt: default-on witnessed tracker for all horizons. |
| **D14** | Meal planning scope = lists + calendar only; **no meal/recipe/nutrition engine** (§5.4) | **REC: yes** (your flag, resolved minimally). |
| **D15** | Budget scope = plan target + linked expenses list; **no new financial tables** (§5.2) | **REC: yes.** |
| **D16** | Co-op export = **print/PDF outline + CSV**; no cross-family live sharing (§5.5) | **REC: yes** for this build. Live co-op sharing is a real future feature — flag it for the horizon list if wanted. |
| **D17** | Mode registry: 7 modes; ONE `bigplans_overcoming` mode with audience adaptation + separate gate key (§11) | **REC: yes.** Alt: separate teen mode row (cleaner role gating, one more prompt to maintain). |
| **D18** | Curriculum plans get **"Copy for next year"** in MVP (plan duplication generalized later) (§5.5) | **REC: yes** — reuse-next-year is half the value of a curriculum plan. |
| **D19** | New `plans.status = 'maintenance'` ("Keeping It Going" section) (§6.6) | **REC: yes** — recovery science requires a post-victory mode that isn't "done and gone." |
| **D20** | **White-hat only:** no variable-reward/scarcity mechanics in any goal surface — a deliberate pushback on the Hook-model items in the condensed intelligence | **REC: yes** — aligned with celebration-only DNA. |
| **D21** | Fresh-start date suggestions (Mondays, month starts, birthdays) offered at plan starts and restarts (§2.6) | **REC: yes** — cheap, evidenced, warm. |
| **D22** | **APPROVED + EXTENDED (2026-07-04)** — Teen slip logs: ambient visibility only (part of the interior — visible when mom's D6 switch is on, not when off), NO alert notifications, and **no opt-in alert toggle offered either** (founder: "an available alarm recreates the pressure"). Crisis language in slip notes fires the global override independent of all visibility state — slips are not the safety pipeline. (§8.6, §14) | As drafted, plus the founder's extension killing the opt-in alternative. |
| **D23** | Overcoming **Safe Person required for teens/kids (a parent); strongly encouraged but not required for adults** ("not yet" allowed; LiLa revisits) (§8.1) | **REC: yes** — requiring adult disclosure up front would block the people who most need to start. Alt: hard-require for all (purer to the principle, higher abandonment). |
| **D24** | Guided "My Goals" is a **dashboard section**, not a page (§9.3) | **REC: yes** — Guided nav stays purpose-built; section registry handles it. Alt: lightweight page in Guided More menu. |

**Process next steps after your review:**
1. You approve/amend the decisions above (any Dxx flips are edits to this doc, not redesigns).
2. This file moves to `prds/addenda/PRD-29-Goal-Science-Addendum.md`.
3. The dispatch factory re-synthesizes the PRD29 pack against PRD-29 + this addendum
   (slice plan will grow: schema slice now includes plan_wheels/plan_support_people;
   Wheel/Overcoming surfaces are likely their own slices; teen/guided Overcoming ships
   dark behind the gate key).
4. TRKG dispatches first (chart-prize dependency), per the manifest sequencing.

---

## Appendix A — Research Appendix (Citations, Dates, and Disagreement Flags)

Sources are for founder/build reference only — the product never cites them (standing
no-external-attribution rule). Ranked roughly by how load-bearing they are for this design.
Web-verified 2026-07-04 unless marked (trained knowledge).

**A.1 — Implementation intentions.** Gollwitzer & Sheeran (2006), *Advances in
Experimental Social Psychology* 38: meta-analysis, 94 independent tests, 8,000+
participants — if-then plans improve goal attainment d ≈ .65 (medium-to-large).
([summary](https://pmc.ncbi.nlm.nih.gov/articles/PMC8149892/),
[original](https://kops.uni-konstanz.de/handle/123456789/10973)) Later domain-specific
metas find smaller effects on objectively-measured health behavior (d ≈ .14–.37) — set
expectations accordingly. **Disagreement flag vs condensed intelligence:** the "38% →
91%" follow-through figure (Atomic Habits framing) traces to ONE exercise study (Milne,
Orbell & Sheeran 2002); use the meta-analytic d=.65 framing in any internal reasoning,
never the 91% number. → Productized as When-Then Plans, the Way step, exit moves.

**A.2 — Mental contrasting + implementation intentions (MCII/WOOP).** Oettingen (2012,
*Eur Rev Soc Psych*; 2014 book-length treatment — trained). Wang et al. (2021),
*Frontiers in Psychology* 12:565202 — meta-analysis of MCII on goal attainment (positive,
small-to-medium across domains).
([meta](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.565202/full))
**Child/adolescent evidence:** Duckworth, Kirby, Gollwitzer & Oettingen (2013), *Social
Psychological and Personality Science* — RCT, 77 fifth-graders, MCII vs positive-thinking
control improved academic outcomes at 2-day and 3-week follow-ups
([pdf](https://www.psy.uni-hamburg.de/de/arbeitsbereiche/paedagogische-psychologie-und-motivation/personen/oettingen-gabriele/dokumente/duckworth-kirby-oettingen-2013.pdf));
Duckworth, Grant, Loew, Oettingen & Gollwitzer (2011), *Educational Psychology* —
adolescent self-discipline/PSAT prep (trained). Digital delivery is active research (e.g.,
2024 VA MOVE! WOOP RCT protocol,
[ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S155171442400106X)).
**Caveat productized (§4.1 expectancy guard):** mental contrasting helps when success
expectancy is high; with low expectancy it can suppress commitment — right-size first
(Oettingen's own moderation findings). → Productized as Wish & Way.

**A.3 — Progress monitoring.** Harkin, Webb, Chang, Prestwich, Conner, Kellar, Benn &
Sheeran (2016), *Psychological Bulletin* 142(2): 138 RCTs, N=19,951 — prompting progress
monitoring increases monitoring AND attainment; effects larger when progress is recorded
and reported/made public.
([APA pdf](https://www.apa.org/pubs/journals/releases/bul-bul0000025.pdf)) → Check-in
machinery, trackers, §6.4 witnessing rules.

**A.4 — Goal-setting theory.** Locke & Latham (2002, *American Psychologist*; 2019
update — trained): specific, appropriately difficult goals + commitment + feedback.
Ordóñez, Schweitzer, Galinsky & Bazerman (2009, "Goals Gone Wild," *Academy of Management
Perspectives* — trained): over-narrow goal pressure produces tunnel vision and ethical
drift — supports witnessed-Horizon framing, merciful checkpoints, and upper-bound design.

**A.5 — Process vs outcome goals + controllability.** Williamson, O., Swann, C., et al.
(2022), *International Review of Sport and Exercise Psychology* — systematic review +
meta-analysis of goal setting in sport: process goals show the largest performance and
psychological benefits; **goal controllability moderates outcomes**.
([article](https://www.tandfonline.com/doi/full/10.1080/1750984X.2022.2116723)) → The
Horizon reframe (§4.2) — the founder's "lose 15 lbs" ruling has direct meta-analytic
backing.

**A.6 — Fresh starts.** Dai, Milkman & Riis (2014), *Management Science* 60(10):2563-2582
— temporal landmarks (new week/month/year, birthdays) measurably boost aspirational
behavior. ([pdf](https://faculty.wharton.upenn.edu/wp-content/uploads/2014/06/Dai_Fresh_Start_2014_Mgmt_Sci.pdf))
→ D21 start-date suggestions; restart framing on the Finish door.

**A.7 — Goal gradient & endowed progress.** Kivetz, Urminsky & Zheng (2006), *Journal of
Marketing Research* — effort accelerates near goals; Nunes & Drèze (2006), *Journal of
Consumer Research* — pre-filled progress increases completion (both trained). → Progress
bars start with "Plan made ✓"; proximity emphasis; never points/streak pressure.

**A.8 — Accountability to a person.** Matthews, G. (Dominican University of California,
2015 study summary; 267 participants, 5 conditions): written goals + action commitments +
**weekly progress reports to a friend** ≈ 76% attained/half-attained vs ≈ 43% think-only.
([summary pdf](https://www.dominican.edu/sites/default/files/2020-02/gailmatthews-harvard-goals-researchsummary.pdf))
**Evidentiary weight flag:** conference-presented, not journal-published — treat as
supporting; the Harkin meta (A.3) and the recovery literature (A.14) carry the mechanism.
→ Support-role scheduled check-ins, family check-ins, auto-drafted progress summaries.

**A.9 — Habit formation timelines & display honesty.** Singh et al. (2024), *Healthcare*
12(23):2488 — systematic review/meta: habit formation median ≈ 59–66 days, mean 106–154,
range 4–335; self-selected + morning habits stick better.
([journal](https://www.mdpi.com/2227-9032/12/23/2488)) Lally et al. (2010), *European
Journal of Social Psychology* (trained): 66-day median; **single missed days did not
materially derail habit formation** — the evidence behind Fresh Reset + never-miss-twice
as product behavior. **Disagreement flags vs condensed intelligence:** (a) "Never Miss
Twice" is a book heuristic with indirect (not direct trial) support — fine as product
behavior, don't claim strong direct evidence; (b) the Hook-model items (variable rewards,
investment mechanics) are deliberately NOT productized in goal surfaces — white-hat only
(D20) — a values-based exclusion, not an evidence dispute.

**A.10 — Identity and change.** Oyserman — identity-based motivation (2009+, trained);
Markus & Nurius (1986), *American Psychologist* — possible selves (trained); Sheldon &
Elliot (1999), *JPSP* — self-concordant goals get sustained effort and greater well-being
on attainment (trained); Verplanken & Sui (2019), *Frontiers* — habit-identity link
(trained). → Validates the Wheel's placement as a peer class and Spoke 6's "I do what the
person I want to be would do."

**A.11 — Role models.** Morgenroth, Ryan & Peters (2015), *Review of General Psychology*
19:465-483 — role models function three ways: behavioral models, representations of the
possible, inspiration.
([article](https://journals.sagepub.com/doi/10.1037/gpr0000059)) → Spoke 3 Part 2's 2–4
role models with specific traits maps exactly onto all three functions.

**A.12 — Planning fallacy.** Kahneman & Tversky (1979); Buehler, Griffin & Ross (1994),
*JPSP* (both trained) — systematic underestimation of task time; outside-view correction.
→ +40% default milestone buffer, visible as breathing room.

**A.13 — Pre-mortem / prospective hindsight.** Mitchell, Russo & Pennington (1989) —
prospective hindsight improves reason generation ~30%; Klein (2007), *HBR* pre-mortem
method (both trained). → The Wall step doubles as the project pre-mortem.

**A.14 — Twelve-step / peer-support efficacy.** Kelly, Humphreys & Ferri (2020),
*Cochrane Database of Systematic Reviews* CD012880 — 27 studies, 10,565 participants:
AA/TSF performed as well as or better than established treatments (incl. CBT) for
continuous abstinence (≈42% vs ≈35% abstinent at 12 months), largely via social-network
mechanisms. ([Cochrane](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD012880.pub2/information),
[clinician distillation](https://pmc.ncbi.nlm.nih.gov/articles/PMC8060988/))
**Extrapolation caveat:** evidence is for alcohol use disorder; applying the PRINCIPLES
(disclosure, support structure, one-day-at-a-time, service) to other behaviors is
principled extrapolation, stated as such. → The Overcoming recovery layer.

**A.15 — Service in recovery.** Pagano et al. (2004–2013+, incl. Project MATCH analyses;
Service to Others in Sobriety scale): helping others predicted substantially better
sustained recovery and lower depression across 10-year outcomes.
([overview](https://case.edu/medicine/about/newsroom/our-latest-news/helping-others-helps-alcoholics-stay-road-recovery-case-western-reserve-research-shows))
→ Spoke 6 service slot in Overcoming.

**A.16 — Abstinence violation effect & self-compassion.** Marlatt & Gordon (1985) relapse
prevention model; Witkiewitz & Marlatt (2004) update (trained): the shame/attribution
spiral after a lapse — not the lapse — predicts full relapse (recent syntheses: strong AVE
reactions ≈3× relapse odds within 6 months). Self-compassion buffers: Adams & Leary
(2007), Wohl, Pychyl & Bennett (2010) (trained). → The slip flow, Bounce-Back Plans,
total-days-practiced display math, no-alarm design.

**A.17 — Secrecy and disclosure.** Slepian (2024), *Current Directions in Psychological
Science* — the burden of secrets comes from the mind returning to them, not concealment
events; confiding to a trusted person relieves burden and builds bonds.
([article](https://journals.sagepub.com/doi/10.1177/09637214241226676)) → The Safe Person
role; "telling your mom or dad is the strongest move in the plan."

**A.18 — Habit reversal training / competing response.** Azrin & Nunn (1973) onward;
well-evidenced for children's repetitive behaviors (tics, BFRBs), typically 8–14
sessions; competing response = simple, physical, incompatible.
([overview](https://my.clevelandclinic.org/health/treatments/habit-reversal-training))
→ Stop & Swap's swap; the teen/adult trigger-map 'swap' counter.

**A.19 — Environment & stimulus control.** Wood & Neal (2007), *Psych Review* — habits
cue from context; Verplanken & Roy (2016) — habit discontinuity: context change windows
are the best moments to rewire (both trained). → Environment-first ruling in the trigger
map; parent-owned environment tasks for kids.

**A.20 — Children/teens and adult content (the founder-critical area).** Converging
guidance: parent-child open, CALM, non-shaming communication is protective and preferred;
restriction/filtering ALONE is ineffective (much exposure is peer-mediated); shame
amplifies compulsive patterns. Key sources: AAP Center of Excellence Q&A on teens and
pornography (2024–2025, [AAP](https://www.aap.org/en/patient-care/media-and-children/center-of-excellence-on-social-media-and-youth-mental-health/qa-portal/qa-portal-library/qa-portal-library-questions/teens-and-pornography/));
trauma-informed review, *Frontiers in Child & Adolescent Psychiatry* (2025,
[review](https://www.frontiersin.org/journals/child-and-adolescent-psychiatry/articles/10.3389/frcha.2025.1567649/full));
barriers/recommendations for parent-child pornography conversations (2024,
[PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11080982/)); Rothman et al. porn-literacy
pilots (2018 *Am J Sexuality Education*; 2020 *AJPH* — small-N, knowledge/attitude gains;
[AJPH](https://ajph.aphapublications.org/doi/10.2105/AJPH.2019.305468)). Grubbs et al.
(2018 *Addiction*; 2019 systematic review/meta) — moral incongruence inflates perceived
addiction and distress independent of use levels
([review](https://joshuagrubbsphd.com/project/moral-incongruence/)) — **directly validates
the never-label rule**: treating a kid's exposure/behavior as a shameful addiction
identity is contraindicated by the evidence; treating it as behavior + environment +
connection is supported. **Honesty note:** this literature is contested (perceived-
addiction vs real-compulsivity debate); the design is robust under EITHER model, because
both camps agree shame worsens outcomes and parent involvement + environment change help.
→ §8.6 guided/teen design: mom-partnered, shame-free, environment-first, replacement
behavior, celebrated progress, exposure gated on the safety stack.

**A.21 — Goal setting for children/adolescents (general).** Self-regulated-learning
intervention meta-analyses (Dignath & Büttner 2008; multiple 2022–2024 SRL metas): goal
setting + planning + monitoring components improve achievement in primary and secondary
students; universal self-regulation interventions show positive distal outcomes
(Pandey et al. 2018, *JAMA Pediatrics* — trained;
[systematic review](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6059379/)). → The teen
tier's full method access and the Guided tier's simplified Wish & Way are
developmentally supported, not decorative.

**A.22 — What we chose NOT to build, evidentially.** Streak-loss pressure (black-hat,
burnout — Actionable Gamification's own warning, consistent with AVE research); public
commitment beyond the family (evidence mixed, wrong register for this platform);
loss-framed commitment devices (effective in some lab work, incompatible with
celebration-only DNA and with A.16's shame findings).

---

*End of PRD-29 Goal Science Addendum — DRAFT. Awaiting founder review (§17).*





