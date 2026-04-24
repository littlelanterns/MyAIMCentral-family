# Composition Architecture & Assembly Patterns

> The Lego architecture for MyAIM Family. How primitives compose. How properties layer. How mom assembles outcomes without dying of friction. How capture becomes finished products.
>
> **Status:** Draft for founder review. Parts 1 and 2. Part 3 (Wizard Library Taxonomy) follows after these parts are approved.
> **Date:** 2026-04-22 (revised from 2026-04-21 initial draft)
> **Author:** Drafting session with Tenise
> **Location:** Repo root (cross-cutting architecture doc)
> **Related docs:** Studio-Intelligence-Universal-Creation-Hub-Addendum.md, Linked-Steps-Mastery-Advancement-Addendum.md, PRD-09A, PRD-09B, PRD-10, PRD-13 (Archives), PRD-14 family, PRD-17 (Universal Queue), PRD-17B (MindSweep), PRD-18 (Rhythms & Reflections), PRD-23 (BookShelf), PRD-24/24A/24B (Gamification), PRD-25 (Guided Dashboard), PRD-26 (Play Dashboard), PRD-28 (Tracking & Allowance), PRD-28B (Compliance & Progress Reporting), PRD-29 (BigPlans), PRD-36 (Universal Timer), PRD-37 (Family Feeds), PRD-06 (Guiding Stars & Best Intentions), PRD-11 (Victory Recorder), PRD-12A/12B (LifeLantern / Vision Quest), PRD-19 (Family Context).
> **Related reference notes:** Lego Architecture Input Notes (2026-04-22) — milestone system, finished products inventory, Reading Tracker.

---

## Why This Doc Exists

MyAIM's schema and prior addenda describe a family intelligence platform where content, tracking, motivation, rewards, assignment, significance, and documentation all compose from a small set of primitives. The combinatorics are vast:

- A randomizer list can be an opportunity with mastery advancement, duration tracking, a reveal-triggered reward, and a roster of three kids sharing rotation memory
- A routine step can pull today's math chapter from a sequential list and today's outdoor activity from a randomizer-with-reveal
- A tracker can accumulate events, fire reveals at milestones, and pull rewards from a named list
- Any content item in the system can be flagged as a milestone and tagged for portfolio, records, transcript, or SDS compliance — then flow into a finished product export

These compositions are supported by the schema. They are referenced in scattered addenda. They are not unified on paper. The result: every time mom, Claude Code, or a future contributor touches the content-and-reward system, the pattern gets re-derived from fragments. Features drift from founder intent because no single doc names the full composition language.

This doc names it. Part 1 defines the primitives, properties, connectors, scope boundaries, and downstream consumers. Part 2 defines the assembly patterns that govern how mom builds compositions without friction.

The architectural principle that frames the whole doc is already named in `MYAIM_GAMEPLAN_v2.2.md`:

> **Lego / Surge Protector Connection Architecture.** Every feature in MyAIM Family is a composable block with standard connection points. Blocks combine predictably. Mom doesn't need to understand database tables to build what she wants — she thinks in outcomes, and the system composes the primitives behind the scenes.

---

## Part 1 — Composition Architecture

### Section 1.1 — Primitives

Primitives are the base Lego blocks. Each one is a distinct category of thing that mom (or AI on mom's behalf) creates, and that other primitives can reference.

#### Content primitives

- **Task.** A single assignable unit of work. Has a title, assignee(s), optional due date, optional reward configuration, completion state. Can be one-off or recurring. Tasks can be produced by routines (linked step fires), accepted from opportunities, or created directly. Every task supports nested subtasks (including via Task Breaker invoked at any point in the task's lifecycle — pre-assignment by mom, or post-assignment by kid if something feels too big).
- **List.** A collection of items, typed by `list_type`: shopping, packing, wishlist, to-do, expenses, custom, prayer, ideas, backburner, habit, consequences, maintenance, records. Lists are the most flexible primitive. List behavior is configured by four independent properties (see Section 1.2): `presentation_mode` (plain / sequential / randomized), `is_browsable` (kids see and pick, or mom-only), `is_opportunity` (items earnable, or just to-do), and `pick_n` (for randomized lists, how many items to draw per invocation). All four are independently togglable at any time. Items in a list can be terminal (literal things to do) OR linked to other primitives (see Section 1.3 — linked list items connector).
- **Sequential Collection.** From mom's perspective, a sequential collection is just a list with `presentation_mode=sequential`. The fact that the schema currently stores sequential collections in a separate table (`sequential_collections`) is implementation detail — historically separate, architecturally a list with a property toggled. When Claude Code touches sequential behavior, the right question is "what does the property say?" not "which table did it come from?" The schema split exists; we don't surface it to mom or treat it as a different conceptual primitive. Future schema work may consolidate; for now, both surfaces (the existing `sequential_collections` table AND lists with `presentation_mode=sequential`) are valid storage for the same concept.
- **Widget.** A display primitive that renders another primitive (or data about it) on a dashboard or hub. Widgets are not standalone content — they surface content.
- **Family Feed Item (`family_moments`).** A post, photo, or shared moment from PRD-37. First-class content primitive because it can carry the full set of properties (milestone, tracking tags, included-in-AI, etc.) and feed downstream consumers like Memory Books.

#### Orchestration primitives

- **Routine.** A composer. Has sections (each with its own schedule), and each section has steps. Steps can be static text OR linked to another primitive (sequential, randomizer, recurring task, browsable opportunity list). Produces task instances when active per its schedule. Can be duplicated and reassigned across family members.
- **Segment.** A dashboard-organizing primitive that groups content into time/context blocks. Mom configures whether a segment is always-on-and-collapsible (default) OR scheduled (time-of-day window AND/OR day-of-week). A segment can contain routines, individual tasks, widgets, trackers — essentially anything that appears on a dashboard. Used across all shells; especially valuable on Play and Guided dashboards to structure a child's day. Sunday segments, school segments, chore segments, morning segments all use the same primitive with different content and optional schedules.

#### Measurement primitives

- **Tracker.** An accumulator. Counts events or measures values. Can have a target (finite goal) or be open-ended. Populates a visual (star chart, progress circle, money jar, bar graph, thermometer, tally marks, coin jar, custom reveal page). Fires reveals at configured intervals and tiers. Consumes completions from tasks, manual taps, linked-source completions, timer sessions, or tracker-specific input flows (e.g., "went potty" button, "read today" log).
- **Reading Tracker.** A specialized tracker for reading logs. Not BookShelf — BookShelf (PRD-23) is mom's curated study/extraction library, separate. Reading Tracker accepts reading-session log entries from any role (mom, dad, caregiver, Special Adult, Independent Teen, Guided child) with optional pages, optional time (optionally via PRD-36 Universal Timer), optional book title (freeform, recently typed, or from currently assigned books), optional date. Mom/Dad version includes multi-member selector for group read-alouds. All entries aggregate to the same Reading Log per family member. Viewable by day/week/month/custom range. Can be attached as a routine step — first log entry of the day satisfies the step; additional entries are accepted and recorded but not required.
- **Victory.** A celebration-recorded event. Produced by user action (never automatic per convention — celebrations are user-triggered). Flows into Victory Recorder and DailyCelebration.

#### Motivation primitives

- **Reward Reveal.** A trigger-and-animation primitive. Visual styles: spinner wheel, scratch-and-reveal, pick-a-card, pick-a-door, mystery box, treasure chest variants (30+ themed), envelope, three-doors, slot machine, color-reveal (multi-level coloring pages), coin-jar-drop. A reveal fires when triggered by a linked condition and pulls its reward from a configured source. Reveals can be configured to rotate across a pool (so tier 1 potty reveals cycle through 3-4 different treasure box styles instead of using the same one every time).
- **Reward List.** A source primitive that reveals pull from. Named and curated by mom ("Potty Small Rewards," "Potty Big Rewards," "Sunday Treat List," "After-School Privileges"). Distinct from general lists because reward-list items are designed to be drawn from, not checked off.

#### People and scope primitives

- **Family Member.** A Lego piece that attaches to lists, primitives, and assignments. Family members have roles (Mom/Primary Parent, Dad/Additional Adult, Special Adult/Caregiver, Independent Teen, Guided/Play child). Which people attach to a primitive controls who can access, add, assign, or receive from it.
- **Roster.** A collection of Family Members attached to a primitive. Implemented via the universal person picker UI component used in task and routine creation — the same "who does this apply to, do they each get one or a combined one?" question. Not a separately specified primitive; it's the output of a universal UI pattern. Claude Code to confirm current component name.

#### Context and intent primitives

- **Best Intention.** A values-aligned intention mom or family members commit to practicing (from PRD-06). Can be tracked via any tracker visual (tally, color reveal, sticker chart, progress circle, etc.). Can optionally connect to a reveal/reward — or mom can explicitly configure "the intention itself is the reward." Setup is meant to be simple: create intention → define what acting on it looks like → pick how you want to track it → optionally attach a reward or mark intention-itself-is-reward.
- **Guiding Star.** A foundational family value (from PRD-06) that orients all other compositions. Context source for LiLa.
- **Archive Item.** A context primitive from PRD-13 — family, member, or relationship context that feeds LiLa and informs compositions.
- **BookShelf Item.** A book (from PRD-23) in mom's study/extraction library. Referenced by study guide assignments, BigPlans, discussion guided modes. **Not** the source for the Reading Tracker (confirmed: Reading Tracker is a separate general-reading log; BookShelf is curated study material).

#### Surface primitives (not content, but navigable pages that read from content)

- **Lists page.** A navigable surface in main nav (per shell). Displays all lists the user has access to (per roster + `is_browsable=true`). Filterable by list_type and by the four list-behavior properties (Section 1.2) — so opportunity lists, mastery lists, activity lists, reading lists, etc. all appear here filtered or categorized as needed. **Accessible to Guided and up.** Guided and up can also create and edit their own lists from this page (per shell-role permissions). The previously-conceived "Opportunity Board" dissolves into this surface — opportunities are simply lists with `is_opportunity=true` and appear here alongside other browsable lists. Mom (or any user) may name a category however they want ("Job Opportunity Board," "Activity Lists," "Reading Lists") — those are display labels, not separate surfaces.
- **Milestone Map.** A dedicated memory surface (not an action surface). Reads from every primitive flagged `is_milestone=true`. Journey-feel timeline with nodes representing individual milestones, spaced by date. Member-scoped via universal person picker (single, multi, or whole family). Filterable by source type and tag. Clickable nodes open the original content in context; Level 2 completion milestones open the milestone receipt. Not a new data store — a view over tagged content. Lives in main nav.
- **Drafts (in Studio).** A Studio page listing all in-progress compositions mom has saved via the save-and-return pattern (Section 2.2). When mom finishes a composition and deploys it, it moves from Drafts to the **Customized** section of Studio — where it becomes reusable, copyable/editable for another child, and available for copy-and-configure (Section 2.7). Customized items remain editable at any time — opening one re-launches its wizard (or page form) pre-populated for changes.
- **Customized (in Studio).** Existing Studio section housing mom's deployed compositions. The destination for Drafts when mom marks a composition complete. Source for copy-and-configure duplication. All items remain editable.

---

### Section 1.2 — Properties that layer onto primitives

Properties are configurable aspects that apply to one or more primitives, changing what the primitive *can do*. A list with `is_opportunity=true` doesn't stop being a list — it becomes a list that also functions as earnable work.

#### The four list-behavior properties (independent, anytime configurable)

A list's behavior is fully described by four independent properties. Mom answers each separately when configuring (or reconfiguring) a list. None require any of the others. Defaults are set so a freshly-created list "just works" as a plain to-do list until mom decides to change anything.

| Property | Values | What it does | Default |
|---|---|---|---|
| `presentation_mode` | `plain` / `sequential` / `randomized` | How items are presented. Plain = all shown together, complete in any order. Sequential = items unlock one at a time in defined order; the next one becomes available when the current one finishes (per its `advancement_mode`). Randomized = items are drawn randomly when invoked, with optional rotation memory. | `plain` |
| `is_browsable` | `true` / `false` | Whether this list shows up on the **Lists page** (Section 1.1) for users on its roster. `true` = roster members see it on the Lists page and can open/interact with it there. `false` = mom-only (or owner-only); doesn't appear on the Lists page for other roster members; mom assigns from it manually. **Note:** This property controls *Lists page access*, NOT dashboard rendering. Whether the list shows on a dashboard is controlled by `display_on_dashboard` (per-list, per-member). | `true` (mom-controlled per list) |
| `is_opportunity` + `opportunity_subtype` + `reward_type` + `reward_amount` + `claim_lock_*` | `true` / `false` (+ config) | Whether items are earnable work. `true` = items have rewards attached (currency, privilege, points). `false` = items are just things to do. Subtypes: repeatable, claimable, capped. | `false` |
| `pick_n` | Integer ≥ 1 | For `presentation_mode=randomized`: how many items the list draws per invocation. When a list is invoked from a routine step, dashboard task tap, or as a linked item from another list, this many items are drawn at once. | `1` |
| `display_on_dashboard` | `true` / `false`, **per-list per-member** | Whether the list itself appears as a widget on a member's dashboard. Default off — lists primarily surface via tasks linked to them, OR via the Lists page. When on for a given member, the list becomes a dashboard widget for that member only. Different members can have different settings for the same list (mom may display her gratitude list on her own dashboard but not Ruthie's; Dad may display the home maintenance list on his dashboard but mom may not on hers). | `false` per member |
| `dashboard_display_mode` | `full` / `truncated` / `collapsed` | When `display_on_dashboard=true` for a member, how the widget renders. `full` = all items visible, scrollable. `truncated` = first N items + "click for more" expansion. `collapsed` = just the title as a header; clicking expands and stays open until member closes it. Per-member configuration when they add the list to their dashboard. | `truncated` |

**These four properties are independent.** Any combination is valid. Some real combinations:

- Plain + browsable + not-opportunity = a normal shopping list visible on the Lists page for shared family members
- Plain + browsable + opportunity = a browsable list of paid jobs (no required order, kid picks any from the Lists page or from a linked task)
- Sequential + browsable + opportunity = sequential paid jobs that unlock in order (kid earns through them in sequence; visible on Lists page as they unlock)
- Sequential + not-browsable + not-opportunity = curriculum mom assigns (Saxon Math chapters; kid never sees it on the Lists page — they only see today's chapter via a linked task)
- Randomized + browsable + not-opportunity + `pick_n=2` = Ruthie's Reading Time list (see Section 1.5 Composition I) — visible on Lists page, primary interaction is via the linked task on her dashboard
- Randomized + not-browsable + not-opportunity = a consequences spinner mom controls (kid never sees it; mom picks when to spin)
- Plain + not-browsable + not-opportunity = mom's private list of things to remember

**All four are configurable at any time, not just at creation.** Mom can flip any of them after creation. Some changes trigger validation prompts (not blocks) when they need additional info — flipping to `sequential` prompts "What order should items go in?", flipping `is_opportunity=true` prompts "Add prices/rewards to existing items?", changing `pick_n` from 1 to 3 prompts "Heads up — Reading Time will draw 3 items per session now. Continue?", flipping `is_browsable=false` prompts "Roster members will no longer see this list on the Lists page. They'll still see linked tasks from it on their dashboards. Continue?". Save-and-return still applies; mom can ignore the prompt and configure later.

#### Other properties

| Property | Applies to | What it does |
|---|---|---|
| `advancement_mode` (complete / practice_count / mastery) | Sequential items, randomizer items, list items, routine linked-step targets, opportunity items | Controls how an item "finishes." Complete = single tap. Practice_count = N completions. Mastery = practice until demonstrated, with optional mom approval. |
| `practice_target` | Items with `advancement_mode = practice_count` | N completions required. |
| `require_approval` | Completions, mastery submissions, opportunity completions (compensation payout) | Gates credit/payment on mom approval. |
| `require_photo` | Completions on any task / list item / routine step | Requires a photo on completion. Independent of `require_note`. Useful for physical tasks where mom wants visual confirmation, or for homeschool portfolio capture. |
| `require_note` | Completions on any task / list item / routine step | Requires a written note on completion. Independent of `require_photo`. Useful for reflective tasks ("Serve Someone" — kid notes what they did), homeschool portfolio narrative capture, gratitude entries, intention tracking. |
| `track_duration` | Items, completions | Logs time spent. |
| `is_included_in_ai` | Any primitive | Controls whether this primitive's content flows into LiLa context assembly. |
| Reveal attachment | Lists, trackers, routines, sequentials, individual items, trackers-at-intervals, trackers-at-tiers, **task-resolution events** (see Section 1.3 reveal-as-task-presentation connector) | Triggers a reveal animation when a condition fires. Reveal configuration supports rotation (pool of reveals cycled) and tier escalation (different reveals at different thresholds). Reveal animations are universal presentation wrappers — they can wrap reward delivery (existing), task resolution (new framing — e.g., tapping Reading Time triggers a treasure box reveal that opens to display today's drawn activity), or any item-resolution event. |
| Reward source attachment | Reveals | Specifies which Reward List (or other source) this reveal pulls from. |
| Rotation memory | Lists (especially consequences, randomizers, opportunity pools) | Controls re-assignment behavior for items drawn from the list. **Configurable at list level, with per-section and per-item overrides.** Common patterns: "don't reassign for at least [n] [day/week/month]" (cooldown rule); "assign at least [n] times per [day/week/month]" (frequency rule); combinations of both per item or section. List-level state (not per-person) — "wash doors" doesn't repeat for any kid until cooldown elapses, regardless of who got it last. |
| Shell visibility | Primitives | Controls which shells (Mom, Dad, Teen, Guided, Play) the primitive appears in. |
| `counts_toward_allowance` | Routines, **Segments**, individual Tasks (recurring or one-off) | Whether this primitive's completion feeds allowance calculation (PRD-28). **Double-counting prevention:** if a routine that counts is inside a segment that counts, the completion counts once at the allowance calculation layer (dedup), not twice. Same applies to a counting task inside a counting routine, etc. The most-specific completion wins. |
| `segment_schedule` | Segments | Mom's choice: always-on-collapsible (default) OR scheduled (time-of-day window AND/OR day-of-week). |
| Assignment mode | **Single tasks (one-off or recurring), list items, list-level defaults, AND lists when attached to a roster** | Two modes: **Shared** = one assignment, whole roster, anyone can complete, first-to-complete marks it for everyone, "completed by" recorded (e.g., "Take out the garbage" assigned to all the boys — first one to do it satisfies it for all). **Per-person** = each roster member gets their own independent instance with their own completion state (e.g., "Make your bed" — every kid has their own daily instance). Granular control with simple defaults: at task level, default per-person; at list level, mom configures the default and can override per item. Surfaced via universal person picker. |
| `kid_can_skip` | Lists (default), with per-item override | Whether kids on the roster can skip-and-defer items they're presented with. Default `false` — only mom can skip. Mom enables `true` per list (or per item) where kid autonomy is appropriate. When skipped, item returns to the pool; rotation memory position preserved. Mom can always skip regardless of this property. |
| Crossed-off grace period | Lists (especially shopping, shared lists) | How long a checked-off item stays visible crossed-out before fading from default view. Mom-configurable per list. Default: not instant-fade (so mom doesn't wonder "did we buy this or did I forget to put it on the list?"). Items remain accessible via archive/history view after fading. |
| `is_milestone` | Any completable or capturable primitive: tasks, list items, lists, sequential collections, goals, victories, journal entries, notepad entries, family feed items | Marks the primitive as significant. Can be applied at creation time, retroactively (long-press or edit), or via LiLa's "Mark as Milestone?" action chip when significance signals are detected. **Never silent auto-apply** — always mom confirms or dismisses. Level 1 = witnessed moments. Level 2 = completion milestones (generates a milestone receipt). See Section 1.3 for completion behavior. |
| `tracking_tags` | Any completable or capturable primitive including family feed items | Array of compliance/records tags: portfolio, records, transcript, sds, esa, behavioral_baseline, iep_goal, therapy_observation, custom tags mom defines. Tagged items auto-feed specific finished products (Section 1.7). Haiku auto-suggests tags when composing from natural language — mom always confirms. |

---

### Section 1.3 — Connectors

Connectors are the glue. Each connector is a specific pattern by which one primitive references, feeds, or triggers another.

#### Linked routine step

A routine step whose content is dynamically pulled from another primitive at display time.

- **Source:** Sequential Collection (pulls current active item) / Randomizer List (pulls current drawn item, or auto-draws in Surprise Me mode) / Recurring Task (pulls today's instance) / Browsable Opportunity List (kid selects from the list when the step activates; selection becomes the nested task for that routine slot).
- **Target:** Routine step.
- **Rule:** Section frequency controls display schedule. Linked source manages its own advancement state independently.
- **Opportunity-linked step flow:** Step shows as "Pick from [Outside Activities]" — kid clicks → list opens → kid picks an item → that item becomes a real task nested in the routine step. Completing the task completes the routine step.

#### Linked list items

A list item that, instead of being a literal terminal item to do, points to another primitive that resolves at runtime. Same connector pattern as linked routine steps; just applied at item level.

- **Source:** Any item in any list.
- **Target options:** Another list (browsable, randomized, sequential, or plain), a Sequential Collection, a Tracker, a Reading Tracker, a routine, or a single task. Effectively any actionable primitive.
- **Resolution at runtime:** When the linked item is invoked (kid taps it, or the parent list draws it as part of a randomized pick), the linked target runs its own behavior — including its own `pick_n` if randomized, its own next-unlocked item if sequential, its own claim flow if opportunity, etc.
- **Parent-slot satisfaction:** The parent list's slot is satisfied when the linked target reports complete. The parent doesn't know or care how many items the linked child produced; it just waits for the "done" signal.
- **Recursion is allowed.** A linked item can itself link to another primitive, which can link further. Each list/primitive in the tree owns its own behavior; composition emerges naturally.
- **Why this matters:** This is what lets mom build something like Ruthie's Reading Time (Composition I) — a randomized parent list that draws 2 items, where some drawn items are simple terminals ("Letter Magnets") and others are linked sub-lists with their own behavior ("My Book House" links to a sequential of stories, which itself has `pick_n=2` so reading 2 stories satisfies the parent slot). Mom calibrates effort across mixed-difficulty items by setting `pick_n` on whichever lists she wants weighted higher; the system just executes faithfully.

#### Opportunity acceptance (from Opportunity Board)

The flow by which a family member claims an item from a browsable opportunity list.

- **Source:** Any list with `is_opportunity=true` AND `is_browsable=true` AND kid on roster.
- **Target:** A real task on the accepter's dashboard.
- **Flow:** Kid browses Opportunity Board → sees relevant lists (Compensation, Activity categories, Available Rewards) → taps an item → confirms claim → task materializes on their dashboard with any configured subtasks → kid completes → completion flows back to whatever's counting it.
- **Mom-assigned flow (for hidden lists, or when mom wants to push):** Mom assigns an opportunity from any opportunity list (browsable or hidden) directly to a kid, bypassing the opt-in.
- **Skip/defer:** Mom or kid can skip-and-return — the item goes back into the pool without being consumed.

#### Nested subtask pattern (the "meets mom's expectations" rule)

Every opportunity item (and every task generally) supports nested subtasks so mom can define "done means done."

- **At list creation:** Mom can add subtasks to any item in an opportunity list. Example: "Clean garage — $100" with subtasks ["Sweep floor," "Organize tools on pegboard," "Break down cardboard and take to recycling," "Wipe down workbench," "Sort and label storage bins"].
- **At assignment/acceptance:** When kid claims or is assigned the task, the subtasks appear nested beneath the parent task on their dashboard.
- **During execution:** Kid can invoke Task Breaker on any subtask they find too big — Task Breaker breaks it into smaller steps that appear as sub-subtasks. This is available on any task in the system, not just opportunities. Task Breaker is a utility (its own Edge Function, NOT a LiLa mode per the LiLa Scope Convention).
- **Completion:** Parent task is marked complete only when all subtasks are complete. Optional mom approval gate before payout/credit.

#### Available Rewards claim pattern

The flow by which a kid commits to earning a reward from the Available Rewards list.

- **Source:** Available Rewards list (list-level opportunity with `reward_type=privilege` or similar).
- **Behavior:** Each reward item has an attached checklist of requirements ("Earn this by completing: 3 extra chores, read 2 books, demonstrate kindness to sibling 5 times").
- **Flow:** Kid browses Available Rewards → picks one they want → reward moves to their dashboard with requirement checklist visible → kid completes requirements → when all requirements check off, reward auto-moves to their "Rewards to Redeem" page → kid redeems when ready.
- **Difference from Compensation:** Compensation pays currency; Available Rewards grants a privilege or named reward. Compensation goes to balance sheet; Available Rewards goes to redemption queue.

#### Compensation claim pattern

The flow by which a kid claims a paid job from a Compensation opportunity list.

- **Source:** Compensation opportunity list (`is_opportunity=true`, items have `reward_type=currency`, `reward_amount` per item).
- **Behavior:** Each job has subtasks defining what "done" means to mom.
- **Flow:** Kid browses → picks a job → job + subtasks appear on task board → kid works through subtasks → parent task complete → optional mom approval → if approved, payment credits to kid's balance sheet (PRD-28).
- **Skip/release:** Kid can voluntarily release a claim before completing. Mom can rescind/reassign.

#### Tracker-to-reveal

A tracker accumulates events; milestones fire reveals.

- **Trigger:** Tracker count hits a configured threshold (every 5, every 10, at goal, at custom tiers).
- **Behavior:** Reveal animation fires. Reveal pulls from its configured Reward List. Optional tier escalation (small reveal at low milestones, bigger reveal at higher milestones). Reveal rotation supported (a pool of 3-4 different reveals rotates so each firing feels fresh).

#### Reveal-to-reward-list

The reveal trigger is distinct from the reward source.

- **Trigger:** Reveal fires (from any source — task completion, tracker milestone, routine complete, sequential item mastered, etc.).
- **Source:** Named Reward List.
- **Behavior:** Reveal animation plays; reward is drawn (randomly or sequentially per reveal configuration) from the Reward List; reward surfaces to the kid.

#### Reveal-as-task-presentation (universal presentation wrapper)

A reveal animation can wrap any item-resolution event, not just reward delivery. This generalizes the reveal pattern from "reward delivery animation" to "any delightful resolution wrapper."

- **Trigger:** Kid (or mom) taps a list-linked task on a dashboard. Instead of resolving silently, a reveal animation plays.
- **Source:** The list the task is linked to. The reveal animation opens to display today's drawn item(s) per the list's `presentation_mode` and `pick_n`.
- **Configuration:** Mom configures per task (or per list) whether tap triggers a reveal animation or just resolves directly. Reveal style picked from the same library as reward reveals (treasure boxes, mystery box, scratch reveal, spinner, etc.). Optional reveal rotation across a pool so it stays fresh.
- **Use cases:** Reading Time treasure box that reveals today's randomized activity; mystery chore reveal for a kid's daily chore draw; surprise activity reveal for "I'm Bored" list draws.
- **Convention:** Reveals are universal presentation wrappers. Same reveal infrastructure powers reward delivery, task presentation, item-of-the-day surfacing, etc. Mom configures per primitive whether to use a reveal or render directly.

#### Routine-completion-to-allowance

Completion data from routines flows into allowance percentage calculation.

- **Trigger:** Routine instance completion (or partial completion — allowance is percentage-based).
- **Target:** Allowance calculation (PRD-28).
- **Behavior:** Multiple routines can feed one allowance pool. Percentage is calculated across all participating routines.

#### Sequential-advancement-triggered-next

When a sequential item finishes, the next item unlocks.

- **Trigger:** Item advances (per `advancement_mode`).
- **Target:** Next sequential item activates.
- **Variant at end:** Optionally chain to another sequential, a reveal, a celebration, a BigPlan milestone, or browse-an-opportunity-list-for-next-pick (mom configures per sequential).

#### Book-completion-to-reveal-or-next

Specialized case of sequential advancement for BookShelf / reading assignments.

- **Trigger:** Book marked complete.
- **Behavior:** Triggers reveal (if configured). Chain-next per mom's configuration: auto-advance to next sequential item OR surface a browsable opportunity list for kid to pick next book.

#### Person-pick-spin (consequences and similar reveal patterns)

Specialized reveal flow where the person receiving the reveal's output is selected in the flow.

- **Flow A (person-first):** Mom or kid taps spinner → modal asks "Who is this for?" → person picks from roster → spin fires → result assigned to that person.
- **Flow B (reward-first):** Spin fires → result shown → "Assign to whom?" → person picked.
- **Configuration:** Per-deploy choice, not global. Mom configures at wizard time — or chooses default-at-runtime for flexibility.
- **Skip behavior:** Mom (and optionally kid, per mom's configuration) can skip-and-return — item goes back to pool, rotation position preserved.

#### Milestone-flag-to-Milestone-Map

When any content is flagged `is_milestone=true`, it surfaces on the Milestone Map.

- **Trigger:** `is_milestone` flag applied (at creation, retroactively, or via LiLa chip accepted).
- **Target:** Milestone Map renders a node for the item.
- **Behavior:** Level 1 — node shows on map at the item's date. Clicking opens original content. Level 2 — when the flagged collection/list/goal completes, a milestone receipt is generated with: item name, time span, constituent sub-items, linked moments along the way, and a LiLa short witnessing statement. Mom can add note/photo. Receipt becomes the clickable node.
- **Completion behavior by shell:**
  - **Play / Guided shell:** Celebration interrupt screen. "You reached a milestone!" Invites note or photo before dismissing. Mom always notified.
  - **Mom / Dad / Teen shell:** Ambient creation + gentle notification. "A milestone was reached: [name]. Want to add a note or photo?" Mom always notified regardless of who completed it.

#### Tracking-tag-to-Finished-Product

When a primitive has `tracking_tags` applied, those tags route the content into the appropriate downstream finished product(s).

- **Trigger:** `tracking_tags` array contains a recognized tag.
- **Target:** Finished product generator(s) for that tag (see Section 1.7).
- **Behavior:** A family feed post tagged `portfolio` feeds the Standards-Aligned Portfolio PDF. A task tagged `sds` + `behavioral_baseline` feeds the SDS Monthly Summary and the Behavioral Baseline Document. A reading log entry tagged `transcript` counts toward the Homeschool Transcript's ELA credit hours. Mom's tag choices determine which finished products each item supports.

---

### Section 1.4 — Scope-of-State

Not all state lives at the same level. Misplacing state causes silent drift.

| Scope | What lives here | Examples |
|---|---|---|
| **Per-person** | Individual progress, individual draws, individual completions, individual mastery state, individual tracker accumulations when tracker is per-person | Each kid's Saxon Math sequential progress. Each kid's skateboard-tricks mastery state. Ruthie's potty chart count. Each kid's balance sheet from compensation jobs. |
| **Per-list (shared across assignees)** | List-level defaults, rotation memory, segment scoping, list-level name and description, is_browsable, crossed-off grace period | Consequences rotation: "wash doors" doesn't re-appear for 3 rotations regardless of which kid got it. Shopping list items added by mom or dad, checked off by either. |
| **Per-assignment-instance** | A specific task spawned from an opportunity. A specific drawn randomizer item for a specific person at a specific time. A specific nested subtask state on a specific assigned task. | "Wash doors assigned to Gideon on Thursday" is a distinct task row. Its subtask completion state is per-assignment. |
| **Per-roster (shared across a specific group)** | State specific to a group that uses the primitive together | Shopping list items: once crossed off by anyone on the roster, they're crossed off for everyone on that roster. |
| **Per-family** | Family-wide configuration, family shared lists, cross-family-member defaults | Family Calendar. Family Best Intentions. Family gamification theme. |

A primitive can have state at multiple scopes simultaneously. Example: a consequences list has list-level rotation memory (shared) AND per-assignment task instances (individual) AND role-scoped segments (some items only for big kids).

---

### Section 1.5 — Supported Compositions (with real examples)

Below are the compositions mom's actual use cases require.

#### Composition A — The School Day

Mom creates a school day for a child. Structure:

- **Segment:** "School Time" (always-on-collapsible; expanded during school hours OR scheduled M-F 9am-2pm — mom's choice)
- **Routine inside segment:** "School Day"
  - **Step 1 (linked sequential):** Math — pulled from Sequential "Saxon 6"
  - **Step 2 (linked randomizer):** Language Arts — pulled from Randomizer "LA Activities" (Surprise Me mode — auto-draws daily)
  - **Step 3 (linked browsable opportunity):** Pick from "Outside Activities" — list opens when kid taps, kid selects an activity, selection becomes a nested task for the step. Outside list has reveal attached — small reveal fires when kid completes outside activity.
  - **Step 4 (linked reading tracker):** Reading — first reading log entry of the day satisfies the step; additional entries still recorded but not required. Book completion triggers reveal + next book via configured chain-next.
- **Allowance connector:** Routine completion percentage feeds allowance pool alongside two chore routines.
- **Tracking tags:** Mom tags the routine with `records` and `portfolio`. Each day's completion data auto-feeds the monthly homeschool report.
- **Milestone:** Mom flags "Year 1 Requirements" list as `is_milestone=true`. When the final item checks off at end of year, Level 2 completion milestone fires, receipt generates.

Primitives used: Segment, Routine, Sequential Collection, Randomizer List, Opportunity list (Outside — browsable), Task, Nested subtasks, Reading Tracker, BookShelf, Reward Reveal, Reward List, Allowance Configuration, Milestone receipt.

#### Composition B — The Potty Chart

Mom creates a potty chart for Ruthie.

- **Tracker:** "Ruthie's Potty Chart" (per-person)
- **Input flow:** "Went potty" button
- **Visual:** Star chart with animated colored star (or Woodland Felt creature) populating per event
- **Tier 1 reveal:** Every 5 events → fires from a **rotation** of 3-4 reveal boxes (cycled so tier 1 doesn't always use the same reveal). Pulls from "Potty Small Rewards" list.
- **Tier 2 reveal:** Color-reveal page (one of 5 levels). Each 10 events completes one coloring reveal. Total journey: 50 events = 5 coloring pages completed.
- **Natural-language-composition example:** Mom says to Haiku: *"I would like a potty chart for Ruthie with a coloring sheet reveal with 10 levels of reveal, the potty duration should be 50 times. Every 5 times (in between fresh coloring reveal sheets) I want it to have a treasure box reveal, but I don't want it to have the same treasure/gift box each time."* Haiku extracts: tracker (per-person, target 50), tier 1 reveal every 5 with rotating treasure boxes, tier 2 color-reveal with 10 levels advancing every 5 events. Populates wizard fields. Mom picks the specific reward list items.

#### Composition C — The Consequences

Mom creates a consequences list.

- **List:** "Consequences" (with `is_opportunity` optional)
- **`is_browsable`:** Mom's choice. Default for consequences: `false`. Alternative: `true` if mom wants kid to pick their own consequence.
- **Roster:** All kids, with role-scoped item visibility (some items big-kids-only)
- **Rotation memory:** List-level — "wash doors" doesn't re-appear for 3 rotations regardless of which kid got it
- **Reveal:** Spinner wheel attached
- **Flow (hidden list):** Mom taps spinner → person-first prompt ("who is this for?") → mom picks kid → spin fires → result shown → mom confirms "Assign" → task created on that kid's dashboard with nested subtasks
- **Flow (browsable variant):** Kid sees the list on their Opportunity Board → kid picks → task goes to their dashboard. Mom's call whether this works for her family.
- **Skip behavior:** Mom can skip-and-return — item goes back to pool, rotation position preserved.

#### Composition D — The Shared Shopping List

Mom creates a shared shopping list with her husband.

- **List:** "Groceries" (shopping type)
- **Roster:** Mom + Dad (both can add, both can check off)
- **Assignment mode:** Shared (per-roster scope)
- **Crossed-off grace period:** 24 hours (mom's choice; non-instant default so mom doesn't wonder "did we buy this or did I forget?")
- **Behavior:** Items added by either. When checked off, stays visible crossed-out for grace period, then fades. Accessible via "View Purchases by Date" archive.
- **At creation:** Mom saves with roster configured but zero items. Drafts state in Studio. Mom comes back later to add items (or AI adds them via Smart Notepad → Review & Route, or bulk-AI-add inside the list).

#### Composition E — The Maintenance Tracker

Mom creates a home maintenance schedule with her husband.

- **List:** "Home Maintenance" (maintenance type)
- **Roster:** Mom + Dad
- **Items:** Each item has an optional recurrence
- **Behavior:** Items auto-surface when due. When marked complete, resets to next due date.
- **Annual view:** Calendar pages with all maintenance events laid out.
- **Optional tracking tag:** `records`

#### Composition F — The Graduation Prep List

Mom creates a "Getting Ready for Graduation" list to share with her son.

- **List:** "Graduation Prep" (custom type)
- **Roster:** Mom + son
- **Time-bound:** Target completion date = graduation day
- **`is_milestone=true`:** List flagged as a milestone from the start. When all items complete, Level 2 completion milestone fires. Receipt generates showing time span, items completed, any moments tagged to the list along the way (photos of graduation rehearsal, cap-and-gown shopping, etc.), LiLa witnessing statement.
- **At creation:** Mom creates list with son on roster and deadline. Items added over time.

#### Composition G1 — The Study Guide Wizard

Mom uploads a book (or has one in BookShelf already) and wants to assign a study guide for a kid to work through.

- **BookShelf Item:** Book in mom's study library
- **Study Guide:** Attached to book (BookShelf feature — PRD-23)
- **Assignment target — mom's choice:**
  - **Option 1 (direct assignment):** Study guide assigned as a recurring task
  - **Option 2 (via sequential):** Study guide broken into a sequential collection, with linked routine step from school routine
  - **Option 3 (standalone):** Study guide assigned as its own tracked item with completion logging
- **Optional reveal:** Chapter complete → small reveal; study guide complete → bigger reveal
- **Optional tracking tag:** `portfolio`, `records`, or `transcript`

Simple: book → study guide → assignment target → optional reveals and tags.

#### Composition G2 — The Best Intention Setup

Mom wants to create a Best Intention and track her practice of it.

- **Best Intention:** Created with a name and description (per PRD-06)
- **What does acting on this intention look like?** Mom describes the observable behavior (e.g., "I want to call my mom once a week," "I want to take 10 minutes to read my scriptures each morning," "I want to greet my kids warmly when they come home")
- **How do you want to track it?** Mom picks a tracker visual: tally, color reveal page, sticker chart, progress circle, money jar, simple count.
- **Reward?** Mom's choice:
  - No explicit reward; knowing you're doing what you intend is the reward itself
  - Reveal at a threshold
  - Named Reward List attached to a reveal
  - Connection to a higher-level goal

#### Composition H — The Year 1 Requirements Milestone List

Mom creates a Year 1 Requirements list (homeschool compliance tracking).

- **List:** "Year 1 Requirements" (custom type)
- **Roster:** Specific kid (per-person)
- **Items:** Each state/curriculum requirement
- **Properties:**
  - `is_milestone=true` — Level 2 completion milestone
  - `tracking_tags: [portfolio, records, transcript, standards]` — feeds Standards-Aligned Portfolio, records archive, transcript generation, standards coverage
- **Behavior:** Each item checks off as completed (manually, or via linked sequential/tracker completion auto-flowing).
- **At completion:** Receipt generates with: list name, time span, every requirement item, all family feed posts tagged to the list along the way, all milestones within the year, LiLa short witnessing statement. Mom adds note/photo. Receipt lives on Milestone Map.
- **Feeds:** Standards-Aligned Portfolio PDF, Homeschool Transcript, Year-End Memory Book.

#### Composition I — Ruthie's Reading Time (linked-items tree, mixed terminal and linked, recursive `pick_n`, optional reveal wrapping)

Mom builds a Reading Time experience for Ruthie. Surfaces as **a task** on Ruthie's School Time segment (lives there because it's linked from a routine step in the school routine, OR exists as a standalone task in the segment). Ruthie sees a single task labeled "Reading Time" — rendered per Play shell styling (themed icon image of a child reading + "Reading Time" label). The list itself is NOT shown on her dashboard; only the task that links to it.

**Parent list — "Ruthie's Reading Time":**
- `presentation_mode = randomized`
- `is_browsable = true` (visible to Ruthie on the Lists page if she navigates there; not relevant to the dashboard task surface)
- `is_opportunity = false`
- `pick_n = 2`
- `display_on_dashboard = false` (mom hasn't opted to display the raw list; primary interaction is via the linked task)
- **Optional reveal attachment:** Mom can attach a treasure box reveal animation. When Ruthie taps Reading Time, the treasure box opens to display today's drawn activities. (Or mom can configure direct resolution — no reveal — for a quieter UX.)

**Items in the parent list (mix of terminal and linked):**
- "Play letter puzzles" — terminal item (a literal activity to do)
- "Write letters in chalk outside" — terminal item
- "Letter Magnets" — terminal item
- "Play Reading Games" — **linked item** → points to "Reading Games" sub-list (`presentation_mode=randomized`, `pick_n=1`). When drawn, the Reading Games randomizer fires, picks 1 game; Ruthie plays that game; "Play Reading Games" reports done.
- "Read from Reading List" — **linked item** → points to a browsable book list (`presentation_mode=plain`, `is_browsable=true`). When drawn, the browsable list opens; Ruthie picks/claims a book; logging her reading session via the Reading Tracker satisfies the slot.
- "Read from My Book House Series" — **linked item** → points to a sequential collection of stories from My Book House (`presentation_mode=sequential`, `pick_n=2`). When drawn, the sequential delivers the next 2 stories; Ruthie reads both; the linked slot reports done.
- "Practice reading" — **linked item** → points to a sequential mastery list of phonics rules (CVC, blends, digraphs, glued sounds, Magic E, syllable types, vowel teams, etc.) with each item's `advancement_mode=mastery` (`presentation_mode=sequential`). When drawn, the sequential delivers the next un-mastered phonics rule; Ruthie practices until mastered (with optional mom approval); the linked slot reports done.

**Runtime flow:**
1. Ruthie taps the Reading Time task on her School Time segment (Play-styled themed icon).
2. If a reveal is attached: treasure box animation plays, opens to reveal today's draw. Otherwise: directly resolves.
3. Parent list draws 2 items per `pick_n=2`. Suppose the draw is "Letter Magnets" + "Read from My Book House Series."
4. Each drawn item appears as a task on her dashboard, rendered per Play shell styling.
5. "Letter Magnets" is terminal — appears as a do-this activity. Ruthie does it, marks it done. 1 of 2 satisfied.
6. "Read from My Book House Series" is linked — the sequential resolves and delivers the next 2 stories (per the child's `pick_n=2`). Ruthie reads both, both check off. The linked slot reports done. 2 of 2 satisfied.
7. Reading Time as a whole reports complete to whatever's tracking it (segment, routine, allowance, tracking tags, etc.).

**Where the raw list is visible:**
- On the Lists page (because `is_browsable=true`) — Ruthie can navigate there and browse the list directly if she's curious about everything in it
- NOT on her dashboard (because `display_on_dashboard=false` for her) — the dashboard surface is task-driven, not list-driven

**What this composition demonstrates:**
- Lists feed dashboards via tasks, not by appearing as raw lists; the kid-facing surface is always the task
- Per-shell rendering — same task data, Play shell adds themed icon + label styling
- Mixed terminal + linked items in the same parent list
- Linked items that resolve to sub-lists with their own `presentation_mode` and `pick_n`
- Mom calibrating effort across mixed-difficulty items by setting `pick_n` on whichever child lists need it (My Book House stories are short, so 2 = comparable weight to other items)
- Optional reveal wrapping for delight (treasure box reveals today's draw)
- The same surface (Reading Time task) gracefully handling whatever combination the random draw produces, because each list owns its own behavior

Primitives used: List (parent randomizer), Lists (child sub-lists), Sequential Collection (My Book House, phonics mastery), Reading Tracker (linked from "Read from Reading List"), Tasks (terminal items resolving to dashboard tasks), Reward Reveal (optional task-presentation wrapper).

Properties layered: `presentation_mode` (varies per list in the tree), `pick_n` (varies — parent has 2, My Book House has 2, Reading Games has 1), `is_browsable`, `display_on_dashboard` (false for the parent list), `advancement_mode` (mastery on phonics items), reveal attachment (optional, on the task).

---

### Section 1.6 — Where primitives and properties live

Cross-reference for which existing doc governs each primitive and property. This doc unifies; it doesn't supersede.

| Primitive or property | Authoritative spec |
|---|---|
| Task | PRD-09A |
| List (and all list_types) | PRD-09B |
| Sequential Collection | PRD-09A + Linked Steps Addendum |
| Routine | PRD-09A + Linked Steps Addendum |
| Segment | PRD-25 + PRD-26 — needs update: segments are schedulable OR always-on-collapsible (default), exist across all shells |
| Widget | PRD-10 |
| Tracker | PRD-10 + PRD-24 |
| Reading Tracker | **Not yet spec'd — this doc surfaces it.** Home: PRD-28 or PRD-10 addendum. Routine integration wires to PRD-09A. |
| Family Feed Item | PRD-37 |
| Reward Reveal | PRD-24A + PRD-24B |
| Reward List | PRD-24 |
| Family Member | PRD-01 + PRD-02 |
| Roster | Universal person picker UI component — Claude Code to confirm current component name |
| Best Intention / Guiding Star | PRD-06 |
| Archive Item | PRD-13 |
| BookShelf Item | PRD-23 (confirmed: not the source for Reading Tracker) |
| Opportunity property | PRD-09A Convention 70 — needs amendment: list-level framing is primary; opportunity is one of four independent list-behavior properties (see Section 1.2) |
| `presentation_mode` (plain / sequential / randomized) | **Not yet spec'd as a unified property — this doc surfaces it.** Home: PRD-09B amendment. Replaces the implicit "list type vs. sequential collection vs. randomizer" trichotomy with a single property that can be configured at any time. Sequential Collection table remains as current storage; the property describes the behavior. **Future schema-consolidation task:** decide whether to consolidate `sequential_collections` into `lists` (or vice versa) so behavior has one canonical storage location. Until then: Claude Code must treat both storage locations identically behaviorally — same logic, same constraints, same connector wiring. |
| `pick_n` (randomized list draw count) | **Not yet spec'd — this doc surfaces it.** Home: PRD-09B amendment. Default 1. Applies when `presentation_mode=randomized`. Composes recursively with linked list items (Section 1.3). |
| `is_browsable` property | **Not yet spec'd — this doc surfaces it as a universal list-level property.** Home: PRD-09B amendment. **Controls Lists page visibility for roster members; does NOT control dashboard rendering** (use `display_on_dashboard` for that). |
| `display_on_dashboard` (per-list, per-member) + `dashboard_display_mode` (full / truncated / collapsed) | **Not yet spec'd — this doc surfaces it.** Home: PRD-09B amendment AND PRD-10 (Widgets). Each member configures whether/how a given list appears on their own dashboard. Lists primarily surface via tasks linked to them; this property is the override for "I want the whole list on my dashboard as a widget." |
| `require_photo` and `require_note` (separate, independent) | **Replaces single `require_evidence` property.** Home: PRD-09A amendment. Each is independently configurable per task / list item / routine step. Useful for portfolio capture, reflective tasks, gratitude entries. |
| `kid_can_skip` | **Not yet spec'd — this doc surfaces it.** Home: PRD-09B amendment. Default false; mom enables per list (or per item) where kid skip-and-defer is appropriate. Mom can always skip regardless. |
| Advancement mode | Linked Steps Addendum + Convention 158 |
| Reveal attachment (universal presentation wrapper) | PRD-24 + PRD-24A + PRD-24B — needs amendment: reveals can wrap any item-resolution event, not just reward delivery. New connector: reveal-as-task-presentation (Section 1.3). |
| Routine-to-allowance | PRD-28 |
| Counts toward allowance | PRD-28 — needs amendment: applies to Routines, **Segments**, AND individual Tasks. Allowance calculation must dedup so a counting task inside a counting routine inside a counting segment is credited once, not three times. Most-specific completion wins at the dedup layer. |
| Segment schedule | To be added to PRD-25/PRD-26 |
| Rotation memory (per-list, per-section, per-item) | Partially in PRD-09B (randomizer draw weighting) — needs amendment to generalize to per-section and per-item overrides with cooldown rules ("don't repeat for [n] [unit]") and frequency rules ("assign at least [n] times per [unit]"). |
| Assignment mode (Shared / Per-person) | Applies to: single tasks (one-off + recurring), list items, list-level defaults, lists with rosters. PRD-09A + PRD-09B amendments needed to make property surface explicit at all levels with task-level default per-person and list-level mom-configurable default. |
| Nested subtask pattern | PRD-09A task structure + Task Breaker utility (separate Edge Function, NOT a LiLa mode per LiLa Scope Convention) |
| Crossed-off grace period | **Not yet spec'd — this doc surfaces it.** Home: PRD-09B amendment. |
| `is_milestone` property | **Not yet spec'd — see Lego Architecture Input Notes.** Multiple PRDs need addenda: PRD-05, PRD-08, PRD-09A, PRD-09B, PRD-11, PRD-12A/B, PRD-37, PRD-28B. |
| `tracking_tags` property | **Not yet spec'd — this doc surfaces it.** Every content-producing PRD needs an addendum. Downstream: PRD-28B. |
| Milestone Map surface | **Not yet spec'd — see Lego Architecture Input Notes.** Home decision pending: addendum to PRD-13 or PRD-37, or standalone PRD. |
| Lists page surface | **Not yet spec'd as a unified per-shell navigable surface in this form.** Home: PRD-09B amendment OR a new lightweight PRD. Replaces the previously-conceived "Opportunity Board" as a separate surface — opportunities are now just `is_opportunity=true` lists displayed on the Lists page alongside other browsable lists. Accessible Guided shell and up; list creation permissions follow shell role. |
| Drafts / Customized pages in Studio | Studio Intelligence Addendum — needs amendment to name Drafts explicitly as a first-class page, clarify the Drafts→Customized deployment flow, and confirm Customized items remain editable (open re-launches wizard pre-populated). |

---

### Section 1.7 — Downstream Consumers (Finished Products)

Finished products are exportable, shareable, or printable artifacts that read from tagged content. They are not primitives. They are downstream consumers that compose primitives into artifacts.

Items marked **current PRD** are spec'd elsewhere; items marked **new** are surfaced by this doc and need PRD homes.

> **Tier assignments are deferred.** Tier (Essential / Enhanced / Full Magic / etc.) is NOT assigned in this doc and should NOT be hardcoded into feature code. Tier assignments live on a **separate tier-assignment chart** (a single source of truth for which tier owns which feature). When code needs to check tier access, it pulls from the chart, not from a hardcoded value in feature logic. This lets mom rearrange tier assignments at any time without touching feature code. **Convention to add to CLAUDE.md:** *Tier access is a configuration concern, not a feature concern. Code references the tier-assignment chart; feature logic does not hardcode tier names. Mom owns the chart.*

#### Homeschool finished products

| Output | PRD home | Source primitives |
|---|---|---|
| Weekly Narrative Report | PRD-28B (current) | Routine completions + task completions + Reading Tracker + victories |
| Monthly Progress Report | PRD-28B (current) | Aggregated weekly data + milestones |
| Annual Progress Report | PRD-28B (current) | Aggregated monthly data + Year 1 Requirements milestone completions |
| Subject Hours Summary | PRD-28B (current) | Tasks + routines + Reading Tracker + trackers tagged by subject |
| Standards-Aligned Portfolio PDF | PRD-28B (current) | Any content tagged `portfolio` or `standards` |
| Standards Coverage Checklist | PRD-28B (current) | Tagged content rolled up by standard |
| Attendance Record | PRD-28B (current) | Routine completions on school days |
| ESA Invoice | PRD-28B (current) | Content tagged `esa` with reimbursement-eligible categories |
| Portfolio Table of Contents | PRD-28B (current) | Generated index of portfolio-tagged content |
| Reading Log / Book List | **New — PRD-28 or PRD-10 addendum** | Reading Tracker entries, filterable by student/year |
| Homeschool Transcript | **New — PRD-28B addendum or standalone PRD** | Multi-year subject + hour + milestone data with GPA and credit hour logic |
| Year-End Memory Book (per student) | **New — PRD-28B or PRD-37 addendum** | Family Feed photos + victories + milestones + goals achieved + LiLa narrative |
| Curriculum Map | **New — PRD-28B addendum** | Subject configs + sequential collections + BookShelf references by year |

#### Disability / SDS finished products

| Output | PRD home | Source primitives |
|---|---|---|
| SDS Monthly Summary | PRD-28B (current) | Shift logs + mom observations + tagged behavioral tracking |
| IEP Progress Report | PRD-28B (current — stub) | IEP-goal-tagged tracking + observations |
| Therapy Summary | PRD-28B (current — stub) | Therapy-tagged observations + trackers |
| Service Justification Letter | **New — PRD-28B addendum** | Behavioral tracking + goal history + caregiver logs + observations |
| Behavioral Baseline Document | **New — PRD-28B addendum** | Tracking widgets + personal goals + mom observations |
| Caregiver Handoff Summary | **New — PRD-27 or PRD-28B** | Shift logs + notes + routines + observations |

#### All-families finished products

| Output | PRD home | Source primitives |
|---|---|---|
| Family Newsletter | PRD-28B (current) | Family Feed + victories + milestones |
| Monthly Family Summary | PRD-19 (current) | Aggregated family activity |
| Celebration Narrative | PRD-11 (current) | Victory Recorder archive |
| Monthly Reflection Card | PRD-11 (current) | Victory Recorder + milestones |
| Celebration Card | PRD-11 (current) | Single victory or milestone as shareable image |
| Year-End Memory Book (family) | **New — PRD-37 or PRD-28B addendum** | Same template as per-student, different scope selector |
| Year-End Family Letter | **New — PRD-37 addendum** | Family Feed + victories + milestones + goal completions → LiLa narrative |
| Child Growth Portrait | **New — PRD-11 or PRD-12A/B addendum** | Victories + Guiding Stars + LifeLantern + mom notes + milestones, LiLa narrative |
| Family Vision Statement | **New — PRD-12B amendment** | Guiding Stars + Best Intentions + values → one-page formatted artifact |
| Meal/Routine Export | **New — PRD-18 addendum** | Current routines formatted as shareable doc |

#### The finished-products model

Every finished product reads from the **same content pool**. The composition flow is:

1. **Capture layer** — anything happens anywhere in the app (feed post, victory, journal, task, list item, goal, tracker entry)
2. **Tag layer** — `is_milestone`, `tracking_tags`, `is_included_in_ai` applied at capture or retroactively
3. **Memory surface** — Milestone Map displays every `is_milestone` node
4. **Finished products** — each generator reads from the set of primitives matching its tag scope and composes the artifact

A child who isn't homeschooled has the same milestone layer and capture layer as one who is. The finished products available differ (no Transcript, no Standards Portfolio) but the capture experience, the Milestone Map, the Memory Book, and the Child Growth Portrait are all identical. This is what makes MyAIM a family platform that happens to support homeschooling — not a homeschool app that happens to have a family feed.

---

## Part 2 — Assembly Patterns

Part 1 defined what the Lego pieces are. Part 2 defines how mom actually assembles them without dying of friction.

### Section 2.1 — The "Finished Result" Wizard Framing

**Rule:** Every wizard is named and organized by the outcome mom is trying to accomplish, not by the tool type it creates.

**Why:** Mom doesn't open the app thinking "I need to create a list." She thinks "I need a shared shopping list with my husband" or "I need a potty chart for my daughter."

**Examples:**

| Outcome-Named Wizard | What it actually composes |
|---|---|
| "Shared Shopping List with Family" | List (shopping) + roster + grace-period config |
| "Consequences for My Kids" | Opportunity list (hidden or browsable, mom's choice) + roster with role-scoped items + spinner reveal + person-pick config + rotation memory + nested subtasks |
| "Potty Chart for Ruthie" | Tracker (per-person) + tiered reveal (5-event rotating + 10-event color-reveal) + two Reward Lists |
| "School Day Routine" | Segment + Routine with linked steps pulling from sequentials/randomizers/browsable opportunity lists + Reading Tracker + allowance connection + tracking tags |
| "Our Home Maintenance Tracker" | List (maintenance) + roster (mom+dad) + per-item recurrence + optional tracking tag |
| "Getting Ready for Graduation" | List (custom) + roster (mom+child) + deadline + `is_milestone=true` |
| "Assign a Study Guide to My Kid" | BookShelf Item + Study Guide + assignment target + optional reveal + optional tags |
| "Set Up a Best Intention I Want to Practice" | Best Intention + tracker + optional reveal or explicit intention-is-reward |
| "Compensation Jobs for Kids" | Opportunity list (compensation, browsable) + items with subtasks and prices + optional mom approval gate |
| "Activity List My Kids Can Browse" | Opportunity list (browsable) + roster + category name + optional reveal per item |
| "Reading Log for My Kids" | Reading Tracker per kid + optional routine integration + tracking tags |
| "Year 1 Homeschool Requirements" | List + roster (specific kid) + `is_milestone=true` + tracking_tags (portfolio/records/transcript) |

**Convention to add to CLAUDE.md:** *Wizards are named by outcome, not by tool type. Every wizard entry on the Studio shelf describes what mom is accomplishing, not what database table the result lives in.*

### Section 2.2 — The Save-and-Return Rule (with Drafts page)

**Rule:** At any step in any wizard, mom can save-and-return-later. The skeleton persists. Mom clicks the saved item in the **Drafts** page in Studio to re-enter the wizard at the step she left.

**Why:** Mom's reality is 90 seconds before a kid interrupts her. If the wizard demands completion in one sitting, she quits. The save-and-return mechanic, when made explicit, lowers the stakes of leaving — mom *knows* her work is preserved, *knows* where to find it, and *knows* she can come back without losing anything.

**Rules of the rule:**

- Every wizard step is skippable with a sensible default.
- Every wizard allows "Save & Come Back" as a persistent action button.
- Saved skeletons live in the **Drafts** page in Studio — a named, visible page mom can open.
- Clicking a saved skeleton in Drafts reopens the wizard at the step mom last completed.
- **Minimum requirement to save:** Nothing. A list can be saved untitled. The system generates a placeholder name ("Untitled Shared List") if mom hasn't named it yet.
- When mom finishes and deploys a draft, it moves from Drafts to the **Customized** section of Studio — available for reuse, copy-and-configure for another child, editing, and future deployment.
- **Customized items remain editable.** Opening a Customized item re-launches its wizard pre-populated with current configuration. Mom changes what she wants, re-deploys. Editing does not move the item back to Drafts; it stays in Customized.

**Explicit save-prompt UX (close-wizard behavior):**

When mom closes a wizard before completion, the system explicitly prompts:

> "Save as a draft to come back to?"
>
> [Yes, save as draft] [No, discard] [Keep working]

- **Default action:** Save as draft. If mom dismisses the prompt without choosing (taps outside, hits back), default behavior auto-saves as draft. Mom never accidentally loses work.
- **"No, discard" requires explicit confirmation:** "Discard this in-progress [outcome]? You'll lose everything you've configured so far. [Discard] [Cancel]"
- **The explicit prompt lowers stakes** — mom sees she has the option to save, knows she can come back, feels safe leaving the modal.

**Reopen-prompt UX (when mom returns to a wizard with an existing draft):**

When mom opens a wizard entry point (from Studio, from a "create new" button, from anywhere) AND a matching draft already exists for that wizard type, the system prompts:

> "We saved this from last time. Want to keep working on it, or start fresh?"
>
> [Continue last draft] [Start fresh — save current as draft too]

- **"Continue last draft"** reopens the saved draft at the last completed step.
- **"Start fresh"** opens a new blank wizard AND saves the existing draft as-is (doesn't discard) so mom can return to it later from the Drafts page. Mom never loses work by choosing "fresh."
- If multiple drafts exist for the same wizard type, mom is shown a brief picker: "You have 3 drafts of this. [Continue draft 1: Untitled Shared List] [Continue draft 2: Sunday Activities] [Continue draft 3: Untitled] [Start fresh]"

**Why Drafts as a page, not just a state:** Mom's brain drops things unless they're visible. A hidden "drafts state" she has to remember to check is a quit-point. A visible Drafts page that shows her what she started but hasn't finished is a completion prompt.

**Implication for data layer:** All primitives created by wizards must support `is_draft` status. Drafts are not visible to other family members until mom deploys them. Drafts do not count toward allowance, do not appear on kid dashboards, do not trigger reveals.

**Convention to add to CLAUDE.md:** *All wizards follow the save-and-return rule. No step demands completion. Drafts are a first-class state AND a first-class page in Studio. Deployment moves a draft to the Customized section. Customized items remain editable. Explicit save-as-draft prompts on close (default save); explicit continue-or-fresh prompts on reopen when a matching draft exists.*

### Section 2.3 — The Tabbed-Category Pattern

**Rule:** When a wizard has many possible configuration options, group them by category in tabs. Mom selects the tabs relevant to her outcome; irrelevant tabs stay collapsed or hidden.

**Why:** A wizard that presents every option in a single long flow overwhelms mom. A wizard that hides all advanced options loses the power moms need.

**Examples:** See Part 1 Composition descriptions for specific tab breakdowns per composition.

### Section 2.4 — The AI-Fills-the-Gaps Pattern (inside wizards)

**Rule:** Mom talks normal. AI organizes her words into the correct combination of primitives and properties. This applies field-by-field inside an active wizard.

**How it manifests in-wizard:**

- Every text field has a "Let AI help" option. Mom types a natural-language description of what she wants for that field; Haiku proposes the structured value.
- A "Let LiLa suggest" button per tab: if mom gets stuck on a tab, LiLa looks at what mom has already filled in and proposes defaults for the remaining fields.
- **Inside-wizard natural language composition:** Mom can say "describe the whole thing" at any point. Haiku populates every relevant tab's fields. Mom reviews field-by-field.

See Section 2.9 for the front-door natural-language entry point (before a specific wizard is chosen).

**Convention to add to CLAUDE.md:** *AI assistance is present at every creation surface. Mom is never forced to map her mental model onto a schema. AI proposes compositions from mom's natural language; mom approves via Human-in-the-Mix (Edit/Approve/Regenerate/Reject).*

### Section 2.5 — The Bulk-AI-Add Universal Rule

**Rule:** Every list, every task creation surface, every composition surface that accepts multiple items supports bulk-AI-add. Mom pastes or talks; AI sorts items into the right structure.

**Status note:** This capability is **already built universally** in the codebase. The architectural gap is that it's not deployed everywhere it should be. This doc records the rule; audit findings should surface the deployment gaps so they can be closed.

**What "bulk-AI-add" means:**

- **Paste input:** Mom pastes a chunk of text. AI parses into individual items with appropriate fields populated.
- **Talk input:** Mom voice-dictates or types naturally. AI parses into structured items.
- **Field inference:** AI fills in fields beyond just the item name where possible — store section for shopping items, category for activities, price for compensation jobs when mom includes amounts.
- **Mom reviews and approves:** Human-in-the-Mix.

**Convention to add to CLAUDE.md:** *Bulk-AI-add is a universal capability, deployed on every creation surface where multiple items can be added. If a new creation surface ships without bulk-AI-add, that is a bug, not a future enhancement.*

### Section 2.6 — The Smart Notepad + Review & Route Fallback

**Rule:** When mom doesn't want a wizard, she can brain-dump into Smart Notepad and have AI route content to the right destinations.

**Why:** Sometimes mom doesn't want to open any wizard. She has a fleeting thought and wants to capture it without deciding where it goes.

**How it works:** Smart Notepad captures the dump. Review & Route (PRD-08) presents each item with a proposed destination. Mom approves, adjusts, or discards per item. Items can route to: tasks, list items, BookShelf entries, Best Intentions, Journal entries, Archive items, calendar events, family feed posts, milestone flags.

**Relationship to wizards:** Smart Notepad is the "pre-wizard" entry point. Items captured there often land in list skeletons that mom then refines via wizard later.

**MindSweep → composition suggestion (the magical integration):**

When mom brain-dumps via MindSweep (PRD-17B), Review & Route already routes individual items to destinations. **The architecture extension:** when MindSweep's parser detects a configuration-worthy item — something that describes a composition mom wants to build, not just a single item to file — it should propose a Natural Language Composition flow (Section 2.9).

**Examples of configuration-worthy detection:**
- Mom dumps: *"I need a potty chart for Ruthie."* → MindSweep detects "chart" + assignee + child name → suggests: "This sounds like something you'd want to set up properly. Want me to start a Potty Chart for Ruthie? I'll prep the basics so you just need to confirm." → Mom taps yes → Haiku composes a draft skeleton (per Section 2.9 flow) and lands it in Drafts. Mom finishes when ready.
- Mom dumps: *"Set up a shared shopping list with husband."* → MindSweep detects "shared" + "list" + "husband" → suggests starting a Shared Shopping List wizard pre-populated.
- Mom dumps: *"Need to track Gideon's reading better."* → MindSweep detects tracking intent → suggests starting a Reading Tracker setup.

**Why this matters:** It bridges capture-first behavior (Smart Notepad / MindSweep) with composition-first behavior (wizards / Natural Language Composition). Mom can brain-dump *and* end up with started skeletons of real compositions, all without choosing a wizard or even thinking "I need to build something." The output of MindSweep becomes a partially-configured Drafts entry mom can finish at her own pace.

**Convention to add to CLAUDE.md:** *MindSweep's Review & Route includes a "configuration-worthy detection" pass. When a brain-dump item describes a composition (not just a single artifact), the system proposes a Natural Language Composition flow and lands the resulting skeleton in Drafts. Mom approves the proposal; she's not auto-routed into a wizard. This is Human-in-the-Mix: MindSweep proposes, mom decides.*

### Section 2.7 — The Copy-and-Configure Pattern

**Rule:** Every successful composition mom creates can be copied as a template for variations. Copy-and-configure lives in the Customized section of Studio.

**Why:** Mom often has multiple similar needs. Forcing her to rebuild from scratch each time is waste.

**How it manifests:**

- Every deployed composition shows a "Duplicate" action.
- Duplication creates a new draft skeleton with the same structure but empty per-assignment state.
- Duplication preserves: structure, properties, connector configuration, reveal attachments, tracking tags, milestone flags.
- Duplication does NOT preserve: assignee (mom picks again), per-person state, per-assignment history.
- For routines with linked steps, duplication asks: "For the new person, which sequential/randomizer should this link to? Same source OR new source?"
- New drafts from duplication land in the Drafts page.

### Section 2.8 — The Composition Validation Rule

**Rule:** If mom configures a composition that doesn't make sense, the system warns her and offers a correction — it does not silently produce a broken composition.

**Why:** Looks-Fine-Failure is the canonical MyAIM risk.

**How it manifests:**

- At save-time: validation checks that the composition is internally consistent.
- Warnings for common misconfigurations:
  - "You've attached a reveal to an empty Reward List. When it fires, nothing will happen."
  - "This routine step is linked to a Sequential Collection that has no items."
  - "This tracker has no target and no reveal intervals. It will count forever but never celebrate."
  - "This opportunity list has no roster."
  - "This opportunity list is `is_browsable=false` and has no mom-assignment flow configured."
- Every warning is a *nudge*, not a block. Mom can override and save anyway.

### Section 2.9 — The Natural Language Composition Flow (front-door)

**Rule:** Mom can describe what she wants in natural language, and Haiku auto-populates as much of the composition as possible. Mom reviews the pre-filled result, accepts what's right, edits what's off, fills in the specifics AI couldn't infer, and leaves fields blank for later. This is a first-class creation entry point — not just a helper inside existing wizards.

**Why:** This is the ultimate expression of "mom talks normal, magic behind the scenes." It matches the AI Magic for Moms brand promise.

**Why Haiku, not Sonnet:** Cost. MyAIM targets ~$0.20/family/month. Every creation-flow call through Sonnet blows the budget at scale. Haiku handles structured extraction reliably and matches the task.

**Entry points:**
- **Studio primary entry:** Alongside the outcome-named wizard catalog, a prominent "Describe what you want" input
- **Universal fallback from any wizard:** Every wizard includes a "Just describe it instead" button
- **Conversational (LiLa Assist or Studio mode):** Mom talks to LiLa; LiLa uses this flow on the backend
- **Smart Notepad promotion:** An item in Smart Notepad can be promoted via "make this into a real thing"

**The flow:**

1. **Mom describes in natural language.** Free text (or voice-to-text).
2. **Haiku parses and composes.** Returns a structured composition.
3. **Pre-filled skeleton appears.** Mom sees the composition pre-filled.
4. **Mom reviews field-by-field.** Accept / Edit / Replace / Defer.
5. **Mom fills in what AI couldn't infer.**
6. **Composition validation runs.**
7. **Mom saves.** Draft skeleton OR active composition.

**What Haiku should extract well:**
- Outcome type, assignees, primitive references, schedule signals, reward-list references, quantity signals, rotation signals, tier signals, shell/age signals

**What Haiku should flag as needs-input:**
- Specific item content, specific visual choices, specific thresholds when mom was vague, roster membership when ambiguous

**What Haiku should never auto-do:**
- Assign anything to a kid without confirmation
- Activate a composition from draft to live without explicit save
- Wire to allowance without explicit opt-in
- Include content in AI context without explicit choice
- Apply `is_milestone` or `tracking_tags` without explicit confirmation

**Human-in-the-Mix enforcement:** Every Haiku-proposed composition is a *proposal*. Nothing is saved or activated until mom reviews.

**Fallback when Haiku can't parse confidently:**

> "Based on what I'm hearing — [Haiku restates mom's description] — these are some wizards that might be customized to fit that need. Want to try one of these, or describe it differently?"

This language preserves mom's dignity, confirms Haiku listened (by restating), and offers a path forward. Mom can pick a proposed wizard (pre-populated with what Haiku did extract) or re-describe in different words.

**Convention to add to CLAUDE.md:** *Natural Language Composition is a first-class creation entry point, available everywhere a wizard is available. Haiku handles composition extraction. Every proposed composition is Human-in-the-Mix. Nothing activates without mom's explicit approval. Fallback language always restates mom's words and offers a path forward, never "I don't understand."*

**Beta-Readiness implication:** This flow is a flagship demonstration of the brand promise. Recommend seeding the test suite with 20-30 real mom descriptions and validating Haiku's extraction quality before beta.

### Section 2.10 — Friction-First Wizard Design Principle

**Rule:** When designing a new wizard, the first question is not "what fields does this need?" — it is "where would mom quit?"

**Design checklist for any new wizard:**

1. What's the outcome this wizard produces? (Name the wizard by outcome.)
2. What's the minimum viable skeleton mom could save in 60 seconds?
3. At what step would a real mom stop because a decision feels too hard?
4. Can that decision be deferred with a sensible default?
5. Can AI fill that decision if mom clicks "let me skip this"?
6. Is there a composition validation warning that catches misconfigurations later without blocking save now?
7. Can the composition be duplicated from another mom has already built?
8. Is bulk-AI-add deployed everywhere multiple items are added?
9. Does the wizard accept a Haiku-pre-populated entry state (from Section 2.9), or only a blank start?

**Convention to add to CLAUDE.md:** *Wizard design begins with friction mapping. Every step has a defined minimum-viable default, an AI fallback, and a save-and-return path. A wizard that forces any non-minimum decision has failed design review. A wizard that doesn't accept a Haiku-pre-populated entry state has failed design review. A wizard that doesn't deploy bulk-AI-add on multi-item fields has failed design review.*

---

## Closing of Parts 1 and 2

Part 1 establishes the Lego language: primitives, properties, connectors, scope boundaries, downstream consumers, and the compositions mom actually needs to build.

Part 2 establishes the assembly rules: outcome-named wizards, save-and-return with Drafts/Customized pages, tabbed categories, AI-fills-the-gaps inside wizards, bulk-AI-add universally, Smart Notepad fallback, copy-and-configure, composition validation, friction-first design, and Natural Language Composition at the front door.

Together they define what it means to compose in MyAIM and how mom composes without friction.

**Open for Part 3:** The Wizard Library Taxonomy — the concrete list of outcome-named wizards that Gate 2 should build. This will reshape the current Gate 2 wizard priority.

Founder review requested on Parts 1 and 2 before Part 3 is drafted.

---

## Draft Notes for Founder Review

1. **Roster via universal person picker** — clarified: Roster is the output of the existing universal person picker component. Claude Code to confirm component name.

2. **Maintenance list type** — captured.

3. **Crossed-off grace period for shopping lists** — captured as a list-level property mom configures per list, non-instant default.

4. **Records List list type** — reframed from "Annual Reference Log" to general-purpose `records` list type.

5. **Opportunity reconciliation** — list-level is primary; task-level is degenerate case. Convention 70 needs amendment. Opportunity Board is specified as a browsable shelf surface distinct from individual opportunity lists.

6. **Segment scheduling modes** — always-on-collapsible (default) OR scheduled. PRD-25 and PRD-26 need updates.

7. **Per-roster scope** — confirmed.

8. **Person-pick-spin per-deploy config** — confirmed.

9. **Book completion chain-next** — auto-advance to next sequential OR surface browsable opportunity list. Confirm.

10. **Wizard vs. form** — all called "wizards" externally; internal differentiation fine.

11. **Natural Language Composition inside wizards (Section 2.4) AND at the front door (Section 2.9)** — both specified. Every wizard accepts Haiku-pre-populated state.

12. **Bulk-AI-Add already built but not deployed everywhere** — deployment gap, not an architectural addition. Triage finding.

13. **Task Breaker invocable post-assignment by kid** — captured. Task Breaker is a utility (own Edge Function, not a LiLa mode per LiLa Scope Convention).

14. **Opportunity list types free-form** — mom names her own (Compensation, Outside, Language Arts, Science Projects, Extra Credit, I'm Bored, Sunday, Available Rewards). "Homeschool Fun" was my ad-hoc label.

15. **`is_browsable` as universal list property** — not opportunity-specific. Any list can be hidden-from-kids.

16. **Milestone system integrated** — `is_milestone` property, Milestone Map surface, shell-aware completion behavior. Multiple PRDs need addenda per Lego Architecture Input Notes.

17. **`tracking_tags` property** — universal layerable property on any completable or capturable primitive INCLUDING family feed items. Feeds downstream consumers.

18. **Reading Tracker** — new primitive, separate from BookShelf. PRD home pending: PRD-28 or PRD-10 addendum.

19. **Finished products inventory** — Section 1.7 captures current + new products. Homeschool Transcript is high-value / high-effort — flag for scope discussion.

20. **Opportunity Board vs. individual opportunity list** — explicitly distinguished. Current PRDs conflate these; cleanup needed.

21. **Drafts and Customized as explicit Studio pages** — Studio Intelligence Addendum needs amendment.

22. **"Wizard vs. page" scope decision** — some simpler outcomes might be single forms rather than multi-step wizards. Externally called "wizards" for consistency; implementation choice is per-outcome. Part 3 will specify.

23. **Four list-behavior properties unified** — `presentation_mode` (plain / sequential / randomized), `is_browsable`, `is_opportunity`, `pick_n` (for randomized lists). Replaces the implicit list-vs-sequential-vs-randomizer trichotomy with one explicit property. All four are independently configurable at any time, not just at creation. Some changes trigger validation prompts (not blocks). PRD-09B needs an addendum to formally specify this. Convention 70 (opportunity-as-task-subtype) remains valid as the degenerate case but the list-level framing is primary.

24. **Sequential Collection framing (Option 3)** — From mom's perspective and architecturally, a sequential collection is just a list with `presentation_mode=sequential`. The schema currently stores them in a separate table (`sequential_collections`), which is implementation detail. When talking to Claude Code, the framing is: the property describes the behavior; the table is current storage. Future schema work may consolidate; for now, both surfaces are valid storage for the same concept.

25. **Linked list items as a connector pattern** — Any list item can be terminal (a literal thing to do) OR linked to another primitive (another list, sequential, randomizer, tracker, etc.). When invoked, the linked target runs its own behavior — including its own `pick_n` if randomized. The parent slot is satisfied when the linked target reports complete. Recursion is allowed. This is what enables compositions like Ruthie's Reading Time (Composition I) — a randomized parent with `pick_n=2` whose drawn items can be terminal activities OR linked sub-lists with their own `pick_n` and `presentation_mode`. Mom calibrates effort across mixed-difficulty items by setting `pick_n` on whichever lists need it. PRD-09B needs an addendum specifying the linked-item pattern at item level (analogous to existing linked-routine-step pattern).

26. **Sequential consolidation flagged for future schema cleanup** — Both `sequential_collections` table and lists with `presentation_mode=sequential` are valid storage. Convention added: Claude Code must treat both storage locations identically behaviorally — same logic, same constraints, same connector wiring. Future schema-consolidation task should pick one canonical storage location to reduce future-glitch surface area.

27. **`require_evidence` split into `require_photo` + `require_note`** — Independent, separately configurable. "Evidence" framing was intimidating; the split allows clearer use cases (homeschool portfolio capture, "Serve Someone" reflection, gratitude entries, physical task confirmation). PRD-09A amendment needed.

28. **Rotation memory expanded with per-item and per-section overrides** — List-level default + per-section overrides + per-item overrides. Cooldown rules ("don't repeat for [n] [unit]") and frequency rules ("assign at least [n] times per [unit]"). PRD-09B needs an amendment.

29. **`counts_toward_allowance` extended to Segments + dedup at calculation layer** — Segments can also count toward allowance. If a counting routine is inside a counting segment, dedup happens at the allowance calculation layer so it counts once, not twice. PRD-28 amendment needed.

30. **Assignment mode applies to single tasks (one-off and recurring), list items, list-level defaults, AND lists** — Not just lists. Two modes: Shared (one assignment, whole roster, anyone completes) vs. Per-person (each member gets own instance). Granular control with simple defaults: tasks default per-person, lists mom-configurable. PRD-09A and PRD-09B amendments needed.

31. **`kid_can_skip` per-list (or per-item) property** — Default false. Mom enables where kid skip-and-defer autonomy is appropriate. Mom can always skip regardless. PRD-09B amendment needed.

32. **`is_browsable` clarified as Lists-page-access (not dashboard rendering)** — Removed earlier framing that conflated `is_browsable` with dashboard widget display. `is_browsable` controls whether the list shows up on the Lists page for roster members. Dashboard rendering is controlled by `display_on_dashboard` (per-list, per-member) with `dashboard_display_mode` (full / truncated / collapsed). Composition I rewritten to reflect: Reading Time is a task on the dashboard linked to the list; the list itself is not displayed on the dashboard.

33. **Lists page replaces "Opportunity Board" as a separate surface** — Opportunities are simply lists with `is_opportunity=true` and appear on the Lists page alongside other browsable lists. Mom can name a category however she wants ("Job Opportunity Board" etc.) — display label, not separate surface. Lists page accessible Guided shell and up; list creation per shell-role permissions.

34. **Reveal animations are universal presentation wrappers (not just reward delivery)** — New connector: reveal-as-task-presentation. Reveals can wrap any item-resolution event — reward delivery (existing), today's task draw (new — e.g., Reading Time treasure box reveals today's drawn activity), mystery chore reveal, etc. PRD-24/24A/24B amendments needed.

35. **Tier assignments deferred and externalized** — Removed Tier columns from Section 1.7 finished products inventory. Tier assignments live on a separate tier-assignment chart (single source of truth). Convention added: code references the chart for tier access; feature logic does not hardcode tier names. Mom owns the chart and can rearrange tier assignments without touching feature code.

36. **MindSweep configuration-worthy detection** — Added to Section 2.6. When MindSweep's parser detects a brain-dump item that describes a composition (not just a single artifact), the system proposes a Natural Language Composition flow and lands the resulting skeleton in Drafts. Mom approves the proposal; she's not auto-routed. PRD-17B amendment needed.
