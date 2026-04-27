# Connector Architecture — Master Plan

> **Purpose:** This document coordinates the design and build of the connector layer that wires action-producing primitives (tasks, Best Intentions, trackers, lists, etc.) to reward consumers (allowance, points, money, Victory Recorder, reveals, custom rewards). The connector layer is the missing data model underneath the Lego architecture vision already named in `Composition-Architecture-and-Assembly-Patterns.md`.
>
> **Audience:** Claude.ai web (planning and design), Claude Code (execution), founder (review and decisions).
>
> **Status:** Phase 0 ongoing. Phase 1 active in the session that produced this doc. Phases 2 and 3 pending.
>
> **Created:** 2026-04-25.
> **Doc location:** `claude/web-sync/` (moved from repo root 2026-04-27 per founder direction so all connector-architecture docs live alongside ground-truth reports for Claude.ai project knowledge sync).
> **Related docs:** `Composition-Architecture-and-Assembly-Patterns.md`, `claude/web-sync/REWARDS_RECON_2026-04-25.md`, `claude/web-sync/AUDIT_REPORT_v1.md`, `claude/web-sync/TRIAGE_WORKSHEET.md`, PRD-06, PRD-09A, PRD-10, PRD-11, PRD-24, PRD-24A, PRD-24B, PRD-28.

---

## 1. The Problem This Plan Exists to Solve

The Composition Architecture document names a vision: every primitive in MyAIM Family is a Lego block with standard connection points, and rewards/reveals/transactional payouts are connectors that plug into any primitive. Mom thinks in outcomes; the system composes the primitives.

The vision is documented. The data model that implements it is not.

Today, the rewards/earnings/gamification surface is a tangle of partially-wired systems that don't share a connector pattern — each one invented its own wiring (allowance via `task_rewards` columns, gamification via `reward_attachments`, color reveals via `reward-reveals/`, Best Intentions via `intention_iterations` with no reward path, etc.). The recon report at `claude/web-sync/REWARDS_RECON_2026-04-25.md` mapped the surface area. The audit report at `claude/web-sync/AUDIT_REPORT_v1.md` flagged at least three rows (F58, F61, F62) as needing cross-feature connector remediation.

Building any new feature against the current state means picking one of the existing partial systems and inheriting its limits, or inventing a fourth pattern. Both paths drift further from the Lego vision.

This plan structures the work to land the connector layer correctly, so subsequent feature builds (wizards, EARNINGS-PAGE consumer, reward economy expansion, color reveals as cross-feature connectors) can compose against a stable foundation instead of being designed against absence.

---

## 2. What Settled During Pre-Plan Discussion

These decisions were reached in the planning conversation that produced this document. They are inputs to the design phase, not outputs of it. The design phase may pressure-test them but should not re-litigate them without explicit founder direction.

1. **Strong composition is the architecture.** Three-layer inheritance: family default → kid → primitive. Earning sources are decoupled from delivery destinations. Multi-routing per action event is supported.

2. **Action-producing primitives are an open set.** Initial members: task completion, Best Intention iteration, tracker entry, list item completion, routine step completion, reading tracker page/chapter/book. The connector model treats them uniformly.

3. **Reward consumers are an open set.** Initial members: allowance percentage credit, money to opportunity pool, points to a counter (decorative or threshold-bearing), threshold prize, reveal animation, Victory Recorder entry, custom reward / privilege.

4. **The IOU page is one consumer surface, not its own architectural problem.** Mom-delivered things (money owed, prizes owed, privileges owed) aggregate into one view. The page is a query against connector-produced records, not a feature with new schema.

5. **Best Intentions is a primitive, not a special case.** It produces action events (each tap is one) and can attach to any reward consumer. Today it has zero connectors wired (just iterations and Victory Recorder built-in). Future configurations include the founder example: 50 mindful eye-contact taps → spa visit IOU.

6. **The four "above-threshold" options collapse to three.** Decorative recognition (A), bonus to separate prize lane (B), boost to allowance percentage (C). Mom-discretionary in-the-moment routing (D) is cut — adds workflow burden to mom that violates the design principle.

7. **Recognition routing = Victory Recorder entry.** Individual victories are wired today; family victories are not yet built. The connector model treats family victory routing as a destination that gracefully no-ops until family Victory Recorder ships, OR family Victory Recorder is sequenced first. Decision deferred to design phase.

8. **The half-wired `tasks.related_intention_id` column is a hygiene item.** Decision deferred but flagged: leave / remove / repurpose. Default lean: remove during connector build cleanup.

9. **EARNINGS-PAGE is downstream of all of this.** Will fall out as a connector consumer query, not a feature with new schema. Off the table as a near-term build.

10. **Wizards are downstream of all of this.** No wizard work proceeds until the connector layer is built, because wizards need to know what they wire against.

---

## 3. Phase Structure

```
Phase 0 — Triage Worksheet work (ongoing background, not paused)
    │
Phase 1 — Connector Architecture Design   ← active now
    │   Output: Connector-Architecture-and-Routing-Model.md
    │
Phase 2 — Connector Build Planning
    │   Inputs: Phase 1 output + Triage Worksheet items that intersect
    │   Output: Connector build plan (folded build with audit fold-ins)
    │
Phase 3 — Connector Build Execution
    │   Inputs: Phase 2 plan
    │   Output: Built connector layer (schema, RPCs, hooks, baseline UI)
    │
[Downstream — not part of this plan]
    Wizards, EARNINGS-PAGE, reward economy expansion, color reveal cross-wiring,
    folded into Phase 3 only where pre-decided; otherwise deferred to their own builds.
```

Phases 1, 2, and 3 are sequential. Phase 0 runs in parallel and does not pause.

---

## 4. Phase 0 — Triage Worksheet (Ongoing)

**Status:** Active. Not paused by connector design work.

**Scope:** Continued work-through of `claude/web-sync/TRIAGE_WORKSHEET.md` rows. Fixes, decisions, and audit follow-up that are not specific to the connector layer continue at founder pace.

**Relationship to connector phases:** When Phase 2 starts, it explicitly scans the Triage Worksheet for rows that intersect with the connector layer. Rows touched by Phase 2 are tagged for fold-in to Phase 3 build. Rows not touched continue Phase 0 handling independently.

**No deliverable from this plan.** Phase 0 has its own sequencing.

---

## 5. Phase 1 — Connector Architecture Design

**Status:** Active. Drafting in the session that produced this document.

**Scope:** Draft the connector data model. Output is a standalone markdown document that defines, at the level needed for Phase 3 to build correctly:

- What a connector record is (universal fields, table shape).
- The set of action-producing primitives the model supports at v1, with the action event signature each one produces.
- The set of reward consumers the model supports at v1, with the receive signature each one accepts.
- Inheritance pattern: family default → kid → primitive override. How records compose, what overrides override, what's inherited silently vs. surfaced to mom.
- Routing rules a connector record can express (1:1, threshold-based, above-floor only, multi-destination, etc.).
- 2-3 worked examples covering distinct shapes:
  - Money-track example: task completion → allowance percentage credit + Victory Recorder entry.
  - Points-with-threshold example: task completion → points jar; jar at N → prize IOU + Victory Recorder entry.
  - Best-Intention-as-primitive example: Best Intention iteration → counter; counter at N → custom reward IOU. (Founder's spa-after-50-eye-contact case.)
- Boundary: what the connector model does NOT cover. Specifically: reveal animation specifics, color reveal subject-mapping, gamification visuals, Victory Recorder narrative generation. These remain in their own PRDs; the connector model only specifies the routing-to point, not the consumer's internal behavior.

**Deliverable:** `claude/web-sync/Connector-Architecture-and-Routing-Model.md`. Peer to `claude/web-sync/Composition-Architecture-and-Assembly-Patterns.md`. Cross-references existing docs; does not duplicate them.

**Process:**

1. Founder + Claude.ai web in conversation. (Active session.)
2. When the design needs ground-truth from existing code or schema, Claude.ai writes a question for Claude Code, founder dispatches, founder pastes back results. (Established pattern.)
3. Iterate until the founder is satisfied that the doc is clear enough for Phase 3 to build correctly without inventing.
4. Commit to repo.

**Decisions Phase 1 must surface and resolve (deferred from pre-plan):**

- Family Victory Recorder sequencing — does the connector model assume it exists, gracefully no-op until built, or is family Victory Recorder pulled into Phase 3 scope?
- The half-wired `tasks.related_intention_id` column — leave / remove / repurpose during connector build.
- Whether the connector model uses one universal junction table or per-consumer-type tables. (This is a real design choice with downstream consequences for query shape and inheritance semantics.)
- Whether the inheritance pattern surfaces provenance to mom in the UI (e.g., "this task earns 2 points (from Maya's template) and 5% allowance (overridden on this task)") — and if yes, what data the model has to carry to make that surfacing possible.
- Above-threshold behavior representation: is it a separate field on the connector record, or expressed as multiple connector records per primitive (one for required, one for above-threshold)?
- How the model represents "no transactional routing, recognition only" cases (Best Intentions today; some configurations of new tasks).

**Decisions Phase 1 must NOT make (out of scope, deferred):**

- Specific reveal animation library design (PRD-24B territory).
- Victory Recorder narrative generation logic (PRD-11 territory).
- Wizard design or Studio Intelligence behavior (downstream).
- EARNINGS-PAGE layout, components, or routing (downstream consumer).
- Specific gamification reward economy mechanics beyond the connector receive signature (PRD-24 territory).

**Phase 1 ends when:** Founder reads the doc and agrees it is clear enough that Claude Code, given the doc plus existing PRDs, could plan the build (Phase 2) without ambiguity about what data shape to produce. Founder decides Phase 1 is done, not Claude.

---

## 6. Phase 2 — Connector Build Planning

**Status:** Pending. Starts when Phase 1 deliverable is committed.

**Venue:** Fresh Claude.ai web session. Phase 1 doc + this master plan + relevant PRDs as project knowledge.

**Scope:**

1. **Triage Worksheet scan.** Read `claude/web-sync/TRIAGE_WORKSHEET.md` (and `AUDIT_REPORT_v1.md` if needed). Identify all rows that intersect with the connector layer. Known starting set: F58 (reward economy as cross-feature lego), F61 (gamification reveal library cross-feature wiring), F62 (color reveal cross-feature connector). Likely additional rows TBD by scan.

2. **Audit fold-in mapping.** For each intersecting row, decide: collapses into Phase 3 build / handles separately in Phase 0 / defers to a downstream build. Document rationale per row.

3. **Build sequencing.** Within Phase 3 scope, identify ordering dependencies. What schema must exist before what RPCs. What RPCs before what hooks. What hooks before what UI. Identify visual-verification checkpoints.

4. **Pre-build investigation questions for Claude Code.** What needs to be true about the existing schema/code before build kickoff that the design doc didn't specify. Generate the Claude Code investigation prompt(s).

5. **Risk and decision log.** What can go wrong during build. What founder decisions might be needed mid-build. What rollback or no-op paths exist.

6. **Build prompt for Phase 3.** The actual prompt that will be handed to Claude Code to execute Phase 3.

**Deliverable:** Connector build plan document. Lives at `claude/web-sync/Connector-Build-Plan-[date].md` or similar (location to be set by Phase 2 session per current web-sync conventions).

**Phase 2 ends when:** The Phase 3 build prompt is drafted, all known fold-in items are mapped, all pre-build investigation questions are answered (via Claude Code dispatches that Phase 2 commissions), and founder approves dispatching Phase 3.

**Kickoff prompt for Phase 2 (paste into fresh Claude.ai session when ready):**

```
I'm starting Phase 2 of the connector architecture work. Phase 1 produced
the design doc at claude/web-sync/Connector-Architecture-and-Routing-Model.md.
Phase 2 is build planning — translating that design into a concrete build
plan with audit fold-ins, sequencing, and a Phase 3 kickoff prompt for
Claude Code.

The master plan is at claude/web-sync/Connector-Architecture-Master-Plan.md. Phase 2
scope is in §6 of that doc.

Before drafting anything, please:
1. Read the master plan in full, especially §6 (Phase 2 scope) and §2
   (settled decisions from pre-plan).
2. Read the Phase 1 design doc.
3. Read claude/web-sync/TRIAGE_WORKSHEET.md and identify all rows that
   intersect with the connector layer. Confirm the known set (F58, F61,
   F62) and identify additional rows.
4. Read claude/web-sync/AUDIT_REPORT_v1.md for context on the flagged rows.
5. Read PRD-06, PRD-09A, PRD-11, PRD-24/24A/24B, PRD-28, and any other
   PRDs the design doc cross-references.

Then present clarifying questions before drafting the build plan. Use the
PRD authoring workflow established in CLAUDE.md (read all references
first, present questions with recommendations, wait for answers, then
draft).

The output is a build plan document, not built code. Founder will dispatch
Phase 3 to Claude Code separately, against the prompt drafted in Phase 2.

Ask me anything I haven't covered before starting Phase 2 work.
```

---

## 7. Phase 3 — Connector Build Execution

**Status:** Pending. Starts when Phase 2 deliverable is committed and founder approves.

**Venue:** Claude Code session(s). Folded build per existing skill/workflow.

**Scope:**

1. Schema migrations for connector tables and any modifications to existing tables.
2. RPCs that read and write connector records, fire on action events, route to consumers.
3. Hooks (React Query) for connector CRUD and event firing.
4. Baseline UI for configuring connectors at the family/kid/primitive levels. (NOT wizards. Just the underlying configuration surface that wizards will eventually use.)
5. Migration of existing partial systems where Phase 2 designated. (E.g., `task_rewards` columns → connector records, if Phase 2 chose that path.)
6. Audit Triage rows folded in per Phase 2 mapping.
7. Visual verification of all wired flows per Convention #243 (Visual Verification Standard).
8. BUILD_STATUS update.
9. STUB_REGISTRY update (any new stubs created, any existing stubs resolved).

**Deliverable:** Built connector layer. Schema deployed. All Phase 2-mapped audit fold-ins resolved or explicitly deferred per documented rationale.

**Phase 3 ends when:** All scope items pass visual verification, BUILD_STATUS reflects the new state, founder confirms it's working in the live family.

**Kickoff prompt for Phase 3:** Drafted as Phase 2 deliverable. Not pre-written here.

**Out of scope for Phase 3:**

- Wizards (any flavor).
- EARNINGS-PAGE (consumer-side surface; falls out as query in a separate later build).
- Reward economy expansion beyond the connector receive signature.
- Color reveal subject-mapping or animation design.
- Family Victory Recorder feature build (unless Phase 1/Phase 2 explicitly pulled it in).

---

## 8. Cross-Phase Conventions

**Project knowledge sync notes** belong at the end of every phase deliverable. Per current Phase 0.26 process: ADD / REMOVE / DO NOT SELECT lists tell founder which project-knowledge files to update so the next session has the right context.

**Pre-build ritual** per `PRE_BUILD_PROCESS.md` is mandatory before Phase 3 kickoff.

**Stub discovery** via grep is mandatory before Phase 3 kickoff. Phase 2 plan should specify the grep commands.

**Build prompts** for Phase 3 must follow current Phase 0.26 prompt conventions: full PRD references + Cross-PRD Impact Addenda + grep for all addenda mentioning touched PRDs + `UNRESOLVED_CROSS_PRD_ACTIONS.md`.

**Visual Verification Standard** (Convention #243) applies to every wired connector path in Phase 3.

**Convention candidates** likely to emerge from this work:
- Connector record uniqueness and idempotency rules.
- Connector inheritance resolution order.
- Action event firing contract (what producers must guarantee).
- Consumer receive contract (what consumers must handle).

These get drafted as Phase 3 progresses and added to `claude/conventions.md` per existing convention process.

---

## 9. What This Plan Is Not

- Not a build prompt. Phase 3 has its own prompt drafted in Phase 2.
- Not a feature spec. The connector layer is architectural, not user-facing. Wizards and EARNINGS-PAGE are user-facing features that come later.
- Not a complete map of every audit row that will be folded in. That mapping is Phase 2 work.
- Not a complete list of consumers. The consumer set will likely expand over time. v1 covers the consumers needed to ship a useful connector layer; later builds add more.
- Not a deadline or pace document. Founder sets pace.

---

## 10. Open Questions Carried Into Phase 1

To be resolved during Phase 1 design work:

1. One universal junction table vs. per-consumer-type tables.
2. Family Victory Recorder sequencing (assume gracefully-no-op vs. pull into Phase 3 scope).
3. `tasks.related_intention_id` cleanup decision (leave / remove / repurpose).
4. Provenance surfacing in UI (yes/no, and if yes, what data carries the provenance).
5. Above-threshold representation (field on connector record vs. multiple connector records).
6. "Recognition-only, no transactional" representation in the model.
7. Whether action-producing primitives need a registry table or are enumerated.
8. Whether reward consumers need a registry table or are enumerated.

This list is open. Phase 1 may surface more.
