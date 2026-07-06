# BigPlans Design Session Brief (claude.ai) — CONSOLIDATED

> Final brief, 2026-07-04. Supersedes the four separately-pasted blocks.
> **Attachments for the claude.ai session:**
> 1. `claude/feature-decisions/BigPlans-Goal-Science-Vision.md` (founder direction — WINS over anything conflicting)
> 2. `prds/` PRD-29 BigPlans (the existing skeleton to amend, not replace)
> 3. `claude/dispatch-factory/PRD29.md` (current-codebase reconciliation pack)
> 4. `reference/bigplans_condensed_intelligence.md` (91-book distilled planning science)
> 5. `reference/stewardship-v1/docs/PRD-11-Wheel-Life-Inventory.md` (The Wheel framework)
>
> Deliverable: ONE complete addendum document — `PRD-29-Goal-Science-Addendum.md`, standard
> addendum format — returned to the founder for `prds/addenda/`. The dispatch factory
> re-synthesizes its PRD29 build pack from it afterward.

---

Research and design session: BigPlans goal-accomplishment redesign for MyAIM Central. The
attached BigPlans-Goal-Science-Vision.md is my founder direction and wins over anything that
conflicts; the attached PRD-29 is the existing skeleton (plans/milestones/components/
check-ins/friction modes) to amend, not replace; the attached PRD29.md pack is the
current-codebase reconciliation; the condensed intelligence is my own 91-book research base —
build on it rather than re-deriving it.

## PART 1 — RESEARCH (web)

Survey the leading evidence-based science for ALL THREE goal classes:

1. **Goal accomplishment / planning:** implementation intentions, mental contrasting (WOOP),
   goal-gradient and progress effects, milestone decomposition, habit formation links,
   accountability effects — including what the research says about goal-setting for CHILDREN
   and adolescents specifically. The condensed intelligence covers much of this from books;
   web research supplements and fills its named gaps (parallel dependencies, budget/resource
   tracking in projects, seasonal transitions).
2. **Identity change:** the evidence around identity-first change, role models, support
   structures — the attached Wheel framework is the operating spine here; research validates
   and enriches it, never replaces it.
3. **Habit cessation / recovery:** what actually produces results — disclosure to a safe
   person, trigger/environment work, one-day-at-a-time granularity, shame-free relapse
   recovery, service — AND specifically the research on age-appropriate, parent-involved
   approaches for children and teens exposed to adult content. This audience matters
   enormously to me.

Rank by strength of evidence and fit for a family platform. Select "a few methods" to
productize.

**CRITICAL NAMING RULE:** methods and principles become PLATFORM CONCEPTS with our own warm
names — never author- or program-attributed in any UI text or feature name (our standing
no-external-attribution rule; "Eat the Frog" precedent; applies equally to book authors,
12-step programs, and the LDS Addiction Recovery Program). Your research doc cites sources
for my reference; the product never does. One carve-out: bridge-to-human RESOURCE REFERRALS
may name real external programs (faith-gated where applicable).

## PART 2 — DESIGN

Produce a complete PRD-29 addendum specifying:

1. **Three peer goal classes with plain routing at intake:**
   - "Something I want to DO or BUILD" → **project plan** (the original PRD-29 backbone —
     give it a FULL, equal design pass; it's the branch families touch first and most often).
     Founder's named examples: refinish a kitchen, clean/organize the garage, create a
     business, create a homeschool curriculum for [student/age/co-op]. The curriculum planner
     is the flagship family project type: BigPlans adds CREATE-a-curriculum (the
     curriculum-parse paste path already exists), instantiates per-subject sequential
     collections, links homeschool subjects/time logs, feeds compliance/portfolio reporting,
     and supports co-op (group) scope with exportable outputs.
   - "Someone I want to BECOME" → **The Wheel** (attached PRD-11). NOTHING in the framework
     is removed — Hub + 6 Spokes + Rim, the "always answers," both Spoke-3 essays, the three
     support roles with their exact boundaries (spouse CAN be Supporter, NEVER Reminder or
     Observer), evidence sources including the blind test. Additions welcome. Required
     additions: Spoke-6 actions plan into real tasks, and SCHEDULED CHECK-INS with each
     support person — not just the Rim self-check-in. Adapt via the concept mapping in the
     vision doc (Helm→LiLa, Keel→InnerWorkings, Mast→Guiding Stars declarations,
     Compass→tasks, Log→Journal) and resolve its six adaptation flags explicitly.
   - "Something I want to STOP" → **Overcoming** (the vision doc's Overcoming section) —
     built ON the Wheel, folding in the recovery principles table (honesty, hope/strength
     beyond your own via faith preferences, safe disclosure, amends, one-day-at-a-time,
     trigger/environment work, maintenance mode, service, relapse ≠ ruin). Honor every hard
     boundary: processing partner never therapist, bridge-to-human always, never diagnose or
     label, kid version mom-partnered and gentle, shame-free as EFFICACY not just philosophy.
2. **Goal → generated structure:** user states the end goal; Haiku/LiLa proposes the
   decomposition into tasks, milestones, and trackers. Every generated artifact is
   Human-in-the-Mix (Edit/Approve/Regenerate/Reject) before it persists. Follows our
   Composition Architecture (Conventions 249-256): outcome-named wizard entry in Studio,
   natural-language description path AND prefilled-form editing path, save-and-return
   drafts, bulk-AI-add. BigPlans is the decomposition and check-in brain — it generates INTO
   the existing task/sequential/tracker/reward infrastructure, never a parallel task system.
3. **Four audience tiers with full screen specs each:**
   - Adult (me and my husband — primary users): method choice, full depth, all three classes.
   - Teen/Independent: own goals, age-appropriate framing across all three classes; support
     structures include a parent; transparency rulings absolute — nothing hidden from parents.
   - Guided: simplified, mom-visible.
   - Kid-with-mom co-planning: mom types in the goal they dreamed up together; planning
     output includes a CHART or COLORING-PAGE REWARD TRACKER — reusing our existing
     infrastructure (coloring reveals are task-linked tally counters; tracker goal→prize
     firing is already scoped as the TRKG build). Never rebuild reward machinery.
4. **Grace-based progress philosophy:** celebration-only is non-negotiable — no shame
   mechanics on missed goals or slips, Fresh Reset thinking, never-miss-twice recovery
   protocols turned into product behavior.
5. **Data model deltas** to PRD-29's existing tables (every column, every enum), permission
   behavior across all five roles, empty states, edge cases.
6. **Integration specs** for the surfaces already waiting on BigPlans: meeting Goals routing,
   BookShelf→BigPlans send, ThoughtSift route-to-BigPlans chips, LifeLantern complex-goal
   handoff, and Convention #167's pick-N-of-M badge/award containers (they land here).
7. **AI cost model:** generation on Haiku, no per-interaction Sonnet except where genuinely
   needed (Wheel/Overcoming guided conversations warrant Sonnet like other deep LiLa modes —
   say so explicitly and cost it), consistent with our <$1/family/month ceiling.
8. **Safety sequencing note:** kid/teen Overcoming surfaces are the most sensitive LiLa
   surface planned — their EXPOSURE gates on the safety stack (Layer 2 shipped; PRD-41
   Layer 1 and PRD-30 monitoring sequenced). Design now; note the gate.

House rules: Lucide icons, no emoji anywhere; warm celebration-only tone; Human-in-the-Mix on
all AI output; nothing facilitates kids hiding things from parents; no external attribution
in UI. Deliverable comes back as one addendum document for `prds/addenda/`.
