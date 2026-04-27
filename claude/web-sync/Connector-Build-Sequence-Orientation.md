# Connector Architecture Build Sequence — Orientation Prompt

> **Purpose:** introduce a fresh Claude Code session (or a new agent in an ongoing sequence) to the multi-worker build plan that's currently in flight. Establishes context, sequencing, and required reading before any code work begins.
>
> **Use this when:** dispatching the FIRST Claude Code session in this build sequence, OR when a fresh session needs to understand where the connector architecture work fits relative to the other parallel workers.
>
> **Don't use this for:** specific worker dispatches. Each worker (Worker 5, Workers 2+3, Worker 4, Phase 3, Phase 3.5, Phase 3.7) has its own paste-ready dispatch prompt. This is the umbrella orientation.

---

## Paste-ready prompt for Claude Code

```
You are joining a coordinated multi-worker build sequence for MyAIM Family. Before doing anything else, read this orientation carefully — it tells you where you fit in a larger plan.

# What's being built

MyAIM Family is moving from a collection of partially-wired features to a Lego-architecture composition system. The central idea: every primitive (task, list, routine, schedule, pool, reward) is a composable block, and a connector layer wires them together via mom-authored rules. The connector layer is conceptually a workflow automation engine for family life — n8n-flavored architecture, family-flavored vocabulary.

The architecture has been designed across two phases of careful work (Phase 1 design, Phase 2 build planning). Three significant build phases (Phase 3 / 3.5 / 3.7) implement the connector layer. Four parallel workers (5, 2, 3, 4) build the primitives the connector layer composes against. The work is sequenced so coordination requirements are explicit and parallel work is forward-compatible.

# The build sequence

The intended order is: Worker 5 → Workers 2 + 3 (parallel) → Worker 4 → Phase 3 → Phase 3.5 → Phase 3.7.

WORKER 5 — Daily Assignments + Painter (Universal Scheduler upgrade)
  Adds a painted-calendar input mode to Universal Scheduler. Mom paints custom schedules on a calendar; the same scheduler primitive handles both recurrence patterns and painted dates. Per-date assignee mappings supported. Time-of-day windows on painted schedules supported. Synthetic deed firings produced when painted days arrive (no-op until Phase 3 lands). This is foundational because it changes how mom expresses "when" for any primitive.

WORKER 2 — Shared Routines
  "One routine, multiple kids, anyone-can-complete, completer's color renders live, allowance credits the actual completer." Establishes the four-mode sharing matrix and instantiation-mode pattern that every shareable primitive across the app must follow.

WORKER 3 — Shared Lists
  Same architectural pattern as Worker 2 but for lists. Coordinates closely with Worker 2; possibly shipped together as one combined worker.

WORKER 4 — Lists Template Deploy
  Smaller infrastructure work. After Workers 2/3 establish sharing patterns, this worker wires up the missing deploy plumbing for list templates.

PHASE 3 — Connector Layer (the central switchboard)
  Ships a contracts table that wires deeds (events from primitives) to godmothers (actions that grant rewards / create tasks / write victories). Nine v1 godmothers. Mom-functional baseline UI. Mom-facing IOU surface. Migration of existing partial systems. Single-cut dispatch — legacy code removed in same commit sequence as migration.

PHASE 3.5 — Multi-pool allowance restructure
  Substantial work. Ten distinct family-configuration scenarios drive the capability set. Per-pool independent configuration, measurement-only pools, cross-pool IF conditions, term-length pools, event-driven pool close, weighted pool combinations, pool lifecycle / seasonal activation, multiple period types coexisting per kid. May split into 3.5a + 3.5b at your discretion.

PHASE 3.7 — First wizards
  Three wizards (Rewards List Wizard, Repeated Action Chart Wizard, List + Reveal + Assignment Wizard). Three seeded templates (Potty Chart, Consequence Spinner, Extra Earning Opportunities). Treasure box rotation/tag/pool infrastructure. May split into 3.7a + 3.7b at your discretion.

# How the sequencing actually works in practice

The order above is the IDEAL sequence. In practice, parallel workers can ship in any order as long as:
- The Coordination Brief's per-worker requirements are followed by each worker
- Phase 3 dispatches when the deed-producing primitives (Workers 5, 2, 3) are sufficiently ready that the migration writes contracts mirroring real production data
- Workers can ship synthetic deed firings as no-op or log-only until Phase 3's deed-firing infrastructure exists

If you're being dispatched as a parallel worker (5, 2, 3, or 4), your dispatch prompt has a paste-ready coordination section from the Coordination Brief that tells you exactly what to build and what to coordinate around.

If you're being dispatched as Phase 3 or later, the parallel workers have already shipped (or shipped enough) and you're consuming what they built.

# Required reading BEFORE any code work

In this order:

1. claude/web-sync/Connector-Build-Plan-2026-04-26.md
   The Phase 2 build plan. Authoritative source for Phase 3 / 3.5 / 3.7 scope, sub-task sequencing, investigations, and risks. Read fully if dispatched to any of these phases.

2. Parallel-Builder-Coordination-Brief-2026-04-26.md (repo root)
   Cross-cutting design principles every builder must respect. Per-worker coordination sections (your dispatch prompt likely already pastes the relevant section). Read §1 (mental model) and §2 (cross-cutting principles) at minimum, regardless of which worker you are.

3. Connector-Architecture-and-Routing-Model.md (repo root)
   The Phase 1 design. Vocabulary (deeds, contracts, the IF, godmothers, stroke_of, payload). Schema design. Architectural decisions. This is the locked design — Phase 2 build plan doesn't supersede it; Phase 2 builds against it.

4. Connector-Architecture-Master-Plan.md (repo root)
   The phase structure overview. Useful for understanding how Phase 3 / 3.5 / 3.7 relate to one another and to future phases.

5. Composition-Architecture-and-Assembly-Patterns.md (repo root)
   The upstream architectural vision. Primitives, properties, connectors, scope boundaries, downstream consumers. Helpful background for understanding why the connector layer is shaped the way it is.

If your work touches existing reward / connector / allowance infrastructure, also read:

6. claude/web-sync/REWARDS_GROUND_TRUTH_2026-04-25.md
   Forensic report on the existing reward, gamification, and reveal infrastructure. Tells you what's wired vs. what's stubbed. Don't assume something is built — look it up here.

7. claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md
   Companion forensic report on existing allowance, scheduler, timer, and connector-relevant infrastructure. Read §0 (single-pool allowance math) before any allowance-touching work; read §2 (multi-pool feasibility) before Phase 3.5 work.

# The mental model

The connector layer is a workflow automation engine for family life — conceptually similar to n8n. The vocabulary maps:
- Triggers (n8n) ↔ Deeds (here)
- Nodes/Actions (n8n) ↔ Godmothers (here)
- Conditions/Filters (n8n) ↔ The IF (here)
- Workflows (n8n) ↔ Contracts (here)

Every primitive you build (or touch) is a Lego block. Every shareable thing you build needs the four-mode sharing matrix from the Coordination Brief §2.2. Every reference between primitives uses polymorphic source addressing (`source_type, source_id`). The wizards (Phase 3.7+) are mom's opinionated low-code surface over the engine. Build the engine to be powerful; build the wizards to keep mom safe from that power.

# Working pattern

- One commit per sub-task. Report back to founder after each commit. Founder approves before next sub-task.
- Plain English mandatory. Every architectural decision and design choice includes a "Plain English" or "What this means for mom" section alongside the technical content. Technical-only confirmations have been a documented failure mode.
- Visual Verification Standard. Each sub-task's "wired" status requires eyes-on browser confirmation, not just passing tests.
- No backward-compatibility scaffolding. Founder's family is the only production family. No feature flags. No deprecation cycles.
- Pacing is the founder's job. Don't suggest stopping points or breaks. Sequence by dependency only.
- Pre-build ritual is mandatory. Before any code work, follow claude/PRE_BUILD_PROCESS.md.
- Before writing code or creating files, run grep to find existing stubs that might intersect with your work. The pre-build process names the specific commands.

# What to do right now

1. Confirm which worker / phase you've been dispatched to. The dispatch prompt that brought you here should be explicit. If it's not, ask the founder before reading further.

2. Read the documents listed above for your phase. At minimum: items 1, 2, 3 always. Items 4-7 as your phase requires.

3. After reading, write a pre-build plan. Confirm understanding of scope, sub-task sequence, investigation results (if applicable), coordination dependencies. Surface any conflicts or open questions to the founder.

4. Wait for founder approval of the pre-build plan.

5. Begin sub-tasks per the relevant build plan section. Commit per sub-task. Report back. Repeat.

# Things to NOT do

- Don't skip the required reading. The architecture is interconnected; partial reading produces partial-fit code.
- Don't reinvent shared infrastructure. Universal Scheduler, Universal Timer, Universal People Picker, sharing-mode selector — all cross-cutting UI primitives are documented in the Coordination Brief §2.9. Use what exists.
- Don't bypass the connector layer. Phase 3 onward, godmothers fire from contracts, contracts fire from deeds, deeds are written by primitives. Don't let your worker dispatch godmothers directly.
- Don't fold scope. If you discover that "we should also build X while we're here," surface it to the founder. Don't silently expand.
- Don't silently re-litigate locked decisions. The Phase 1 design is locked. The Phase 2 build plan locks scope and sequencing. If you find a real flaw, surface it to the founder; don't quietly work around it.

# Project knowledge sync

These documents must be in your project knowledge before you can work effectively:

REQUIRED:
- Connector-Build-Plan-2026-04-26.md
- Parallel-Builder-Coordination-Brief-2026-04-26.md
- Connector-Architecture-and-Routing-Model.md
- Connector-Architecture-Master-Plan.md
- Composition-Architecture-and-Assembly-Patterns.md
- CLAUDE.md
- claude/PRE_BUILD_PROCESS.md

REQUIRED if working on connector / reward / allowance infrastructure:
- claude/web-sync/REWARDS_GROUND_TRUTH_2026-04-25.md
- claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md

If any of the above are missing from project knowledge, surface to founder before proceeding.

# Final note

The architecture has been carefully designed over multiple long planning sessions with the founder. The decisions in the Phase 1 design and Phase 2 build plan reflect real trade-offs and real family scenarios — not theoretical preferences. When something feels arbitrary, it's because the reasoning lives in those documents. Read them.

Good luck.
```
