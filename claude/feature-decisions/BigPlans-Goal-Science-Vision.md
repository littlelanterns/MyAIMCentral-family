# BigPlans — Goal Science Vision (Founder Direction)

> **Status:** Founder vision statement, 2026-07-04. **REVERSES the PRD-29 PARKED ruling**
> (D-PRD29-0 / triage SCOPE-2.F67 "Defer-to-Gate-4") per the newer-wins rule (Convention #11).
> BigPlans is unparked; the Factory's PRD29 pack requires re-synthesis against this document.
> This doc records intent — it does not replace PRD-29, it amends its direction.

## Founder's words (2026-07-04, near-verbatim)

> "I'd like to build something for BigPlans, based on whatever leading goal accomplishment
> science etc. has, and for tasks and milestones and trackers to be generated/suggested based
> on the end goal. I'd like a few methods for adults, also teens, and probably a guided, and
> maybe even a kid version, where if they come up with a goal with mom, mom can type in the
> goal, plan it, and it could create a chart or coloring page reward tracker or something.
> Being able to create and track goals is something my independent and guided kids especially
> need, as well as myself and husband."

## What this means (interpretation for the design session)

1. **Grounded in goal-accomplishment science.** The design session researches leading
   evidence-based methodologies (implementation intentions, WOOP/mental contrasting,
   goal-gradient effects, habit stacking, milestone decomposition, etc. — the research decides
   the list) and the product offers "a few methods," not one. NO external attribution in UI
   text per the standing rule — methods become platform concepts, never author-branded.
2. **Goal → generated structure.** The user states the END GOAL; the system generates/suggests
   the decomposition: tasks, milestones, and trackers. Human-in-the-Mix on every generated
   artifact (Convention #4). This is the Composition Architecture applied to goals — LiLa/Haiku
   proposes, mom/teen reviews field-by-field (Conventions 251/253).
3. **Four audience tiers:**
   - **Adult** (founder + husband are primary users) — full method selection, full planning depth.
   - **Teen/Independent** — age-appropriate framing, own goals, own dashboards.
   - **Guided** — probably; simplified, mom-visible per transparency rulings.
   - **Kid-with-mom co-planning** — kid dreams the goal WITH mom; mom types it in and plans it;
     output includes a **chart or coloring-page reward tracker** the kid can see and love.
4. **Reuses existing reward/tracker infrastructure — never duplicates it:**
   - Coloring-page reward tracker = the EXISTING coloring-reveal system (1:1 task-linked tally
     counters, `member_coloring_reveals`, Build M) linked to goal tasks — not a new mechanism.
   - Charts = existing tracker/widget system; tracker-goal→prize firing is the TRKG pack —
     BigPlans consumes it, doesn't rebuild it.
   - Milestone/pick-N-of-M logic: Convention #167 explicitly deferred badge/award
     pick-N-of-M containers TO BigPlans — it lands here.
   - Generated tasks flow through existing task/sequential-collection primitives.
5. **Known integration points already waiting on BigPlans** (from the Factory manifest):
   meeting Goals routing, BookShelf→BigPlans send, ThoughtSift route-to-BigPlans chips,
   LifeLantern complex-goal handoff.

## Project-class plans (founder emphasis, 2026-07-04 — equal weight, not an afterthought)

Founder clarification, near-verbatim: BigPlans must also cover "just wanting to break down
refinishing a kitchen, or cleaning and organizing a garage, or creating a business, or
creating a homeschool curriculum for [student/age/co-op] and those types of big plans as
well. The [identity/overcoming] part is hugely important to turn those big changes and growth
into actionable steps, but these are also a huge part of BigPlans."

**Ruling: the three goal classes are PEERS.** The routing question at intake is plain:
- "Something I want to DO or BUILD" → **project plan** (the original PRD-29 backbone:
  plans → milestones → components → check-ins → friction detection)
- "Someone I want to BECOME" → **The Wheel**
- "Something I want to STOP" → **Overcoming**

The design session must give the project class a full, equal design pass — it is the branch
most families touch first and most often. The condensed intelligence is majority
project-class material (backward planning from due date, big-to-small decomposition,
outcome-based milestones, decision rules at transitions, the four-category friction
taxonomy, household-specific patterns).

**Founder's example projects, with their integration notes:**

1. **Home projects (refinish the kitchen, clean/organize the garage):** state the outcome →
   generated phase/milestone/task decomposition (HITM) → tasks land in the real task system;
   sequential collections for strictly-ordered phases; friction-finder check-ins when it
   stalls. Budget/resource tracking is a NOTED GAP in the book extraction — the research
   pass should cover the project dimensions the books didn't (budgets, parallel
   dependencies, seasonal timing).
2. **Creating a business:** the systems-thinking material is already strong in the condensed
   intelligence (work ON the system, franchise-prototype test, innovation→quantification→
   orchestration, minimum-viable-system). Adult tier; the founder herself is the archetype
   user.
3. **Creating a homeschool curriculum for [student / age / co-op]:** the flagship
   family-specific project type. Generates per-subject sequential collections (the
   `curriculum-parse` Edge Function already handles PASTE-a-curriculum; BigPlans adds
   CREATE-a-curriculum — plan it from goals, then the plan instantiates collections);
   links to `homeschool_subjects` + time logs (PRD-28); feeds compliance reporting and
   portfolio (PRD-28B/PRD-37) so the plan built here becomes the evidence trail there;
   the CO-OP scope means planning for a group beyond the household — outputs must be
   exportable/shareable. Directly serves the platform's ESA/homeschool audience.

Project plans and the daily system layer connect per the goals-vs-systems principle: the
plan generates the milestones, the milestones generate the tasks/routines/trackers, and the
existing infrastructure (tasks, sequential collections, trackers, allowance/reward pipelines
where kids are involved) carries daily execution. BigPlans is the decomposition and check-in
brain, never a parallel task system.

## Doors compose — they are entry framings, not silos (founder clarification, 2026-07-04)

Founder rulings, near-verbatim:
1. **The identity-heavy parts stay central** — "we don't need to remove the identity heavy
   parts. That is just one path in the BigPlans landscape." The project emphasis above adds a
   peer, it does not demote The Wheel.
2. **Outcome goals redirect to controllable actions.** Her example: "lose 15 lbs" —
   "redirect to choosing actions we can control instead of results, and helping settle on
   those, and creating goals, milestones, trackers, meal plans etc. to go along with that."
   This is the process-vs-outcome principle made product: when a stated goal is an outcome
   the user cannot directly control (weight, a grade, someone else's behavior), LiLa
   explicitly reframes — the COMMITMENTS are controllable actions; the outcome is tracked as
   a witnessed result, never a pass/fail judgment. Design the reframe conversation; it is one
   of the highest-value moments in the whole feature. (Meal plans: generated structures land
   in existing list/recipe surfaces — the design session scopes how far meal planning goes
   rather than silently building a meal engine.)
3. **The doors are intake framings, not architecture.** Real goals blend: "lose 15 lbs" is
   part project (milestones), part system (habits/trackers), sometimes part overcoming (stop
   evening snacking), sometimes part identity (become someone who moves every day). The user
   walks in through whichever door matches their words; the system composes primitives from
   any of them. Never force a goal into one door's shape.
4. **Two more framings join the door list:** "PLAN something" (planning as a first-class
   activity — plan the school year, plan a trip — value delivered even before execution
   commitment) and "COMPLETE something" (finishing what was started — the half-done projects
   pile is a real and distinct motivation, especially for moms; intake can begin from an
   existing stalled effort, not only from a fresh goal). The design session decides the final
   door presentation (probably fewer visible doors with smart routing underneath, not six
   buttons) — the requirement is that all six intents are SERVED: build/do, plan, complete,
   achieve-an-outcome (via controllable-action redirect), become, stop.

## The Wheel (founder addition, 2026-07-04)

Founder direction: **utilize The Wheel from StewardShip v1 inside the MyAIM framework.** Her rules:
- **Nothing in the current Wheel is removed. Adding is allowed.** The framework (from her
  therapist) is preserved whole: Hub + 6 Spokes + Rim, the "always answers," the two Spoke-3
  essays, the three support roles with their boundaries (spouse CAN be Supporter, NEVER
  Reminder or Observer), evidence sources incl. the blind test, "I do what the person I want
  to be would do."
- **Scope:** changing a character trait in oneself, or developing a new big one — the
  identity-change class of goal, distinct from project goals. The design session decides
  placement (likely: The Wheel is BigPlans' method for identity-class goals; when a stated
  goal is "who I want to become" rather than "what I want to accomplish," LiLa routes there).
- **Must include:** discussing and planning actions (Spoke 6 → real tasks), and **scheduling
  check-ins with the support people** — the Supporter, Reminder, and Observer each get
  scheduled touchpoints, not just the Rim self-check-in (this is an ADDITION to the original,
  which only scheduled the Rim).

**Source material preserved on disk:**
- `reference/stewardship-v1/docs/PRD-11-Wheel-Life-Inventory.md` — full original PRD, verbatim
  (includes the Life Inventory, a candidate LifeLantern/PRD-12A cousin — flag for that pack).
- `reference/stewardship-v1/src/components/wheel-components-archive.md` — original components.
- `reference/bigplans_condensed_intelligence.md` — the 91-book condensed planning intelligence
  (already existed; the goal-science research base).

**Concept mapping for adaptation (StewardShip → MyAIM):**
The Helm → LiLa guided mode · The Keel → InnerWorkings (`self_knowledge`) · The Mast →
Guiding Stars declarations · Compass tasks → `tasks` · The Log → Journal · Crew → family
members / Archives people · Rim scheduling → Universal Scheduler (PRD-35).

**Adaptation flags for the design session (resolve, don't silently decide):**
1. Support people in MyAIM can be family members (roles respect the spouse constraints) or
   outside people — decide storage (family_member_id vs free-text vs Out-of-Nest).
2. Check-in scheduling: Rim + per-role check-ins via Universal Scheduler; Reminder-role
   permission could someday connect to family messaging — design the seam, don't overbuild.
3. Spoke 3 Part 1's deliberate discomfort is a SELF-CHOSEN deep-dive by an adult — it does not
   violate the context-reference tone rule (which governs LiLa referencing stored context
   uninvited), but the design must state how the two coexist, and crisis override applies
   globally as always.
4. Faith language in Spoke 1/Spoke 4 ("belonging to God," "turning to God") integrates with
   `faith_preferences` rather than being hardcoded.
5. Audience: The Wheel is the adult (and possibly teen) tier's deep method. Whether teens get
   it, and with what mom visibility per the transparency rulings, is a design decision.
6. Wheel essays/data are deeply personal adult content — visibility/privacy design must
   respect existing spousal-privacy patterns (dad's reflections precedent) while honoring
   the no-hiding-from-parents rule if a teen version exists.

## Overcoming (founder addition, 2026-07-04)

Founder direction: fold in the applicable principles of **12-step programs and the LDS Church
Addiction Recovery Program, expressed in universally friendly language**, so a user who wants
to OVERCOME something — stop a behavior, get free of a habit or compulsion — is served by this
same system. Her words (near-verbatim): "A lot of independents and even guided kids will have
things they want to stop doing (adult content finds kids WAY too young, and it is terrifying,
and angers me). So what they can do that is age appropriate and will give real results."

**Goal-class routing gains a third branch:** project goals (milestones/trackers) · becoming
goals (The Wheel) · **overcoming goals** (The Wheel + the recovery-principles layer). The
design session decides whether "overcoming" is a Wheel variant or its own named method — but
it builds ON the Wheel, not beside it, because the frameworks overlap heavily:

| Recovery principle (universal language) | Where it lands |
|---|---|
| Honesty — naming the thing without flinching | Hub + Spoke 3 Part 1 (already exists) |
| Hope / strength beyond your own | Spoke 1's belonging frame; the higher-power element integrates through `faith_preferences` — rich for faith-active families, universally warm for others, never hardcoded |
| Fearless inventory | Spoke 3 Part 1 (already exists — the overlap that proves the fit) |
| Telling someone safe (confession/disclosure) | Spoke 4 support people; for kids this is A PARENT, by design |
| Making things right (amends/restitution) | NEW spoke-level addition for overcoming-class Wheels |
| One day at a time | Daily granularity layer: daily check-in/streak surface with Fresh Reset — a slip resets nothing except today |
| Trigger + environment work | NEW: identify when/where/what precedes the behavior; environment changes become tasks (for kids, environment changes are largely PARENT tasks — filters, device location, schedule) |
| Daily maintenance after victory | Rim continues post-completion at lower frequency; maintenance mode |
| Service — helping someone else | Spoke 6 addition; connects to family service infrastructure |
| Relapse ≠ ruin | Never-miss-twice recovery protocol (already in the condensed intelligence); celebration-only is non-negotiable — the app NEVER shames a slip, ever |

**Age tiers for overcoming — the part that matters most to the founder:**
- **Adult:** full framework, full depth, private per existing adult-privacy patterns.
- **Teen/Independent:** real framework, age-appropriate language; support structure includes a
  parent. Transparency posture per standing rulings.
- **Guided kid:** gentle, MOM-PARTNERED BY DESIGN — the kid works it WITH mom (consistent with
  [[no-hiding-from-parents]] and with what actually works clinically for children: parent
  involvement, shame-removal, environment change, replacement activities, celebrated progress).
  The kid-facing frame is "something I want to stop doing," never clinical or scary. No
  deep-discomfort inventory for children — that element is adults-only.

**Hard boundaries (non-negotiable, state them in the addendum):**
1. LiLa is a processing partner, never a therapist or recovery counselor — the platform
   provides STRUCTURE and bridges to HUMANS (parents, church programs, professionals,
   real meetings). Resource referrals may name real external programs (gated by faith
   preferences where applicable, e.g. the LDS ARP for LDS-identifying families); UI copy never
   brands the in-app method with program names — the principles become platform concepts.
2. Never diagnose, never label ("addiction," "addict" never applied to the user by LiLa —
   users' own words only, per the context-reference tone rule).
3. Crisis override global as always; disclosure of harm/abuse in these conversations follows
   the existing safety architecture. Kid/teen overcoming surfaces should NOTE a dependency on
   the safety-gate work (Layer 2 shipped; PRD-41 Layer 1 + PRD-30 monitoring sequenced) —
   design now, gate kid-facing exposure on the safety stack like everything else LiLa.
4. Shame is the enemy of recovery — every screen, every empty state, every slip interaction
   is designed shame-free. This is where the platform's celebration-only DNA is not just
   philosophy but efficacy.

## Process next steps

1. **claude.ai research + design session** — goal-science research (web-capable) + PRD-29
   amendment/addendum design honoring this vision and PRD-29's existing skeleton
   (plans/milestones/components/check-ins/friction modes). Output: PRD-29 addendum in
   `prds/addenda/`.
2. **Factory re-synthesis** — PRD29 pack rebuilt against PRD-29 + new addendum; re-placed in
   the dependency graph (no longer Gate-4-gated; sequencing vs TRKG pack matters — TRKG likely
   first since BigPlans consumes tracker-goal firing).
3. Normal PRE_BUILD ritual at dispatch.
