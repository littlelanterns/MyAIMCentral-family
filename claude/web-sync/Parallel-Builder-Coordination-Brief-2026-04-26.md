# Parallel Builder Coordination Brief

> **Purpose:** This document coordinates the parallel builds currently in flight or queued for MyAIM Family. It documents the cross-cutting design principles every builder must respect, the shared primitives every builder must use rather than reinvent, and the specific coordination requirements between builds.
>
> **Audience:** Claude.ai web (planning), Claude Code (execution), founder (review and dispatch). Each parallel worker's dispatch prompt should include the relevant section of this Brief.
>
> **Status:** Draft, 2026-04-26. Output of Phase 2 of the Connector Architecture work; produced alongside `Connector-Build-Plan-2026-04-26.md`.
>
> **Doc location:** `claude/web-sync/` — peer to `Composition-Architecture-and-Assembly-Patterns.md`, `Connector-Architecture-Master-Plan.md`, `Connector-Architecture-and-Routing-Model.md`. (Moved from repo root 2026-04-27 so all connector-architecture docs live alongside ground-truth reports.)
>
> **Why this doc exists:** several major builds are landing in parallel or in close sequence (Worker 5 Painter, Workers 2+3 Shared Routines+Lists, Worker 4 Lists Template Deploy, Phase 3/3.5/3.7 Connector Layer). Without explicit cross-build coordination, each builder makes local decisions that can fight downstream work. This Brief gives every builder the context they need to make decisions in the same direction. The Lego architecture demands that every builder knows they're building Lego blocks — not standalone features.

---

## 1. The Mental Model — Workflow Engine for Family Life

Everyone working on this set of builds should hold this mental model:

**The connector layer is a workflow automation engine for family life — conceptually similar to n8n, Zapier, or other event-driven workflow tools.** The vocabulary is family-flavored ("deeds" for events, "godmothers" for actions, "contracts" for the if-this-then-that rules, "the IF" for trigger conditions) but the architectural shape is the same: events fire, rules evaluate, actions execute.

If you've worked with n8n or similar workflow tools, the mental model maps cleanly:

- **Triggers (n8n) ↔ Deeds (here)** — events that start a workflow
- **Nodes/Actions (n8n) ↔ Godmothers (here)** — what happens in response
- **Conditions/Filters (n8n) ↔ The IF (here)** — qualification logic for when to act
- **Workflows (n8n) ↔ Contracts (here)** — the wired rules connecting triggers to actions

**The architectural goals are the same as n8n's:** extreme composability, low-code-but-still-powerful authoring (the wizards are mom's "low-code"), explicit data flow that's debuggable, and clean separation of concerns between event production and action execution.

**The architectural risks are also the same:** workflow engines famously become bewildering when authors create deeply nested logic. The wizards (Phase 3.7 and beyond) are the user-facing layer that prevents this — mom doesn't author raw contracts, she uses opinionated templates. **Build the engine to be powerful; build the wizards to keep mom safe from that power.**

**Plain English of why this matters for every builder:** every primitive you build is a Lego block in a larger workflow engine. Every shareable thing you build (lists, routines, tasks, schedules, pools) gets wired together by contracts that mom (and eventually LiLa) authors via wizards. If your block has hardcoded assumptions about HOW it gets used or WHO uses it or WHEN it fires, you've broken the Lego promise. The connector layer is what stitches blocks together into workflows; your job is to make your block a clean, composable, addressable unit.

---

## 2. Cross-Cutting Design Principles

These principles apply to every parallel build. They are not optional. If a build's existing design conflicts with one of these, surface the conflict to the founder before writing code — don't silently work around them.

### 2.1 — Polymorphic source addressing

**Plain English:** when a primitive needs to point at "any kind of thing," use the pattern `(source_type TEXT, source_id UUID)` rather than a typed foreign key.

**Why:** the connector layer's contracts table uses this pattern as its central addressing convention. Any primitive that produces deed firings or that gets referenced by godmother configs should use the same pattern. This is already a de-facto convention in the existing codebase (`reward_reveal_attachments`, `earned_prizes`, `notifications`, `activity_log_entries`, `family_requests`, `studio_queue`).

**For builders:** if you're tempted to add a column like `task_id UUID FK tasks(id)` to express "this references a task," ask whether the column should actually be `(source_type TEXT, source_id UUID)` because it might need to reference other primitive types in the future. Default toward polymorphic; fall back to typed FK only when the entity is truly singular and won't generalize.

**Trade-off accepted:** the database can't enforce referential integrity on polymorphic columns the way it can on typed FKs. Application code handles deletes and orphan cleanup. This is the cost of generality and we accept it.

### 2.2 — Four-mode sharing matrix

**Plain English:** every shareable primitive (tasks, routines, lists, rewards pools, treasure box pools, animation pools, anything else that mom might want shared across kids or deeds) declares a sharing mode from this fixed set:

1. **Single owner, single use** — one person uses it for one specific deed only
2. **Single owner, multi use** — one person uses it across many deeds
3. **Multi owner, single use** — multiple people share it, but it's only used in one deed
4. **Multi owner, multi use** — multiple people share it across many deeds

**Why:** combinations of shareable primitives produce emergent complexity (a chore list per kid + a shared rewards pool + per-kid reveals = three primitives, each with its own sharing mode = many possible compositions). The matrix keeps mom's mental model simple by giving her four well-defined options per primitive instead of N×N×N possibilities to reason about.

**For builders:** when designing a shareable primitive, the schema needs `sharing_mode` (or equivalent) as an enum column with these four values. Behavior at execution time depends on the mode:
- **Single owner** modes mean state is per-person (each person has their own copy of the primitive's state, e.g., depletion progress on a rewards pool)
- **Multi owner** modes mean state is shared (depletion happens once across all sharers — Maya getting the popsicle means Helam can't get it)
- **Single use** modes mean the primitive is wired to exactly one deed
- **Multi use** modes mean the primitive can be wired to multiple deeds

**The matrix is the matrix.** Don't introduce a fifth mode. Don't combine fields across modes. If a use case seems to need something outside the matrix, surface it to the founder — it's likely a sign of a different primitive being conflated with sharing semantics.

### 2.3 — Instantiation mode for multi-assignee schedules

**Plain English:** when a routine, task, or list is scheduled (via Universal Scheduler / Painter) and attached to MULTIPLE assignees, mom must declare an instantiation mode:

1. **Per-assignee instance** — N parallel independent executions, one per assignee. (Bathroom routine where each kid has their own bathroom: each kid gets their own independent execution.)
2. **Shared instance, anyone-completes** — 1 execution; any of the assignees can satisfy it. First completer wins. (Meal prep where the list needs to happen once and any kid in the pool can do it.)

**Why:** these are genuinely different family operations. Per-assignee instance means each kid's progress is tracked separately, allowance credit accrues separately, completion is independent. Shared instance with anyone-completes means the system tracks who actually did it (for allowance credit, accountability) and the routine/list/task is satisfied for everyone once one person completes.

**For builders:**
- **Worker 5 (Painter / Universal Scheduler upgrade)** — when the painting wizard attaches multiple assignees, surface the instantiation mode question explicitly to mom. Don't default silently.
- **Workers 2 + 3 (Shared Routines + Shared Lists)** — own the execution model for shared instances. Track the actual completer's identity. Allowance credit goes to the actual completer, not split across the pool.
- **Connector layer** — treats both modes uniformly at the deed-firing level. The deed firing carries `family_member_id` of the actual completer, regardless of mode.

This pattern is documented in the Composition Architecture doc but needs explicit cross-builder discipline to ship correctly.

### 2.4 — Source category filter on contracts

**Plain English:** every primitive that mom creates (lists, tasks, routines) carries a mom-defined `category` property. Mom can wire connector-layer contracts that fire for "any deed in source_category='reading_activity'" rather than having to manually wire one contract per task.

**Why:** Lego architecture demands that mom can express patterns at the right level of abstraction. "All my reading activities count toward extra credit if missed" is a category-level rule. Without category filtering, mom would have to manually wire one contract per task in the reading category and re-wire every time a new reading activity is added. That's not Lego.

**For builders:**
- **Worker 3 (Shared Lists)** and any list-producing build — lists must carry a `category TEXT` column (mom-defined values; not a fixed enum). Free-form text or a per-family category vocabulary table.
- **Worker 5 (Painter)** — primitives painted via the Painter inherit category from their underlying source.
- **Connector layer** — contracts can specify `source_category` as an alternative to `source_id` for category-level wiring. Both modes valid; mom picks per contract.

The category vocabulary is mom-defined. Examples: "reading_activity," "outside," "chores," "language_arts," "Sunday_list," "music," "extra_credit." There's no fixed taxonomy; mom invents categories as she organizes her family's primitives.

### 2.5 — Override mode for contract inheritance

**Plain English:** when mom creates a kid-level (or deed-level) contract for a godmother that already has a family-default contract, the UI asks her at write time:

> *"You already have a family-default for this. Should this new contract:*
> - *Replace the family default for this kid (changes you make to the family default later won't affect this kid), or*
> - *Override just this field (this kid inherits everything else from the family default, so future changes to the family default still flow through)?"*

The contract row stores which mode mom picked (`override_mode TEXT` with values `'replace'` or `'merge'`).

**Why:** the right behavior is mom's choice per contract. Defaulting silently to either (a) or (b) creates surprises later. Asking removes the surprise.

**For builders:** any UI surface that creates contracts at non-family-default levels must surface this question. The four-mode wizard library (Phase 3.7) handles this in its contract authoring flow. Mom-direct contract creation (the baseline UI from Phase 3) handles it in the form.

### 2.6 — Family timezone for all time-of-day logic

**Plain English:** "end of day," "end of week," "morning window," "Sunday" — all of these are family-local concepts, not UTC. Every time-of-day or date-boundary computation must respect the family's configured timezone (existing pattern: `family_circles.timezone`).

**Why:** UTC math produces user-visible bugs. "End of week" in UTC might be Tuesday morning in the family's local time. Allowance period close in UTC might fire while the kid is still completing their Sunday tasks in their local timezone.

**For builders:** any cron job, scheduled-trigger evaluation, day-boundary calculation, or time-window check must derive from the family's timezone. The existing `calculate-allowance-period` Edge Function does this correctly (per `calculate-allowance-period/index.ts:172-189`); follow the same pattern.

### 2.7 — Templates designed for future community sharing

**Plain English:** templates (Studio templates, wizard-produced templates, list templates, anything mom can save and reuse) should carry source/origin metadata from day one, even if community sharing isn't built yet.

**Why:** community-shared templates is a forward-looking feature. Schema should anticipate it so the future build doesn't require migration. Template rows should carry:
- `template_source TEXT` — `'platform'` (shipped in seed), `'family'` (mom-built), `'community'` (someday)
- `original_author_id UUID NULL` — the family member who first authored it (for community attribution)
- `cloned_from_template_id UUID NULL` — if mom customized a platform/community template, this points back to the source

**For builders:** when designing any template-shaped table, include these columns. Don't worry about the community sharing UX yet — that's a future build. Just make sure the schema can support it.

### 2.8 — Presentation mode as a config dimension

**Plain English:** when a godmother grants something (a task, a prize, a custom reward, an IOU), HOW the kid becomes aware of the grant is configurable per contract. Options include:
- **Silent** — the grant happens; kid discovers it on next dashboard view
- **Plain text notification** — "You got a new task!" with no animation
- **Reveal animation** — treasure box opens, card flips, scratch-off, spinner, etc.

**Why:** reveal animations are presentation choices, not separate godmother types. Mom should be able to attach OR NOT attach a reveal to any grant. The original design proposal had `reveal_godmother` as a separate godmother; the consolidated design folds reveal-as-presentation into a `presentation_mode` config field on grant-style godmothers.

**For builders:** grant-style godmothers (`prize_godmother`, `custom_reward_godmother`, `assign_task_godmother`) carry a `presentation_mode` config. The reveal animation infrastructure (existing `reward_reveal_attachments`, `reveal_animations`) becomes the presentation layer rather than its own godmother type. Workers building flows that produce grants don't need to wire reveals separately — they configure presentation mode on the grant itself.

### 2.9 — Cross-cutting UI primitives must be reused, not reinvented

**Plain English:** several UI components are cross-cutting Lego pieces that all builders should use rather than reinventing:

- **Universal People Picker** — for selecting one or more family members in any context (assigning, attaching, configuring)
- **Universal Scheduler** — for any "when does this happen" configuration (with the Painter as a new mode — see §3.1)
- **Universal Timer** — for any time-tracking attached to any primitive
- **Sharing Mode Selector** — for setting the four-mode sharing matrix on a shareable primitive
- **Category Picker** — for assigning mom-defined categories to primitives
- **Presentation Mode Picker** — for choosing how a grant is presented (silent/text/reveal animation)

**For builders:** if your UI needs any of the above, USE THE EXISTING SHARED COMPONENT. Don't build a worker-local copy. If the shared component doesn't yet support what you need, extend it in the shared layer. Surface to the founder if you're unsure whether a component exists or where it lives.

### 2.10 — Deed `source_type` strings are LOCKED to verb-form (hard constraint)

**Plain English:** every deed firing any worker writes uses the exact verb-form string from the locked v1 set below. Don't substitute past-tense or parent-level forms even if you see them used elsewhere in the codebase.

**The locked v1 set** (Phase 2 build plan §3.3, ratified 2026-04-26 after pre-parallel investigation):

```
task_completion
routine_step_completion
list_item_completion
intention_iteration
widget_data_point
tracker_widget_event
time_session_ended
scheduled_occurrence_active
opportunity_claimed
randomizer_drawn
```

**Why this is locked NOW (not deferred to Phase 3):** three different naming styles coexist in production today — parent-level (`reward_reveal_attachments.source_type` uses `task`, `intention`, `list`), event-level past-tense (`victories.source` uses `task_completed`, `intention_iteration`), and event-level verb-form (Phase 2 build plan picked `task_completion`, `intention_iteration`). Workers 2/3/5 write deed firings before Phase 3 ships. If any worker silently inherits the wrong style, every deed-producing code path that worker shipped needs migration. Locking the convention before the parallel workers dispatch eliminates that risk.

**For builders:** when your primitive completes/fires/activates, write the deed firing using the verb-form string verbatim from the list above. Do NOT use:
- `task_completed` (past-tense — that's `victories.source` style, different domain)
- `task` / `intention` / `list` (parent-level — that's `reward_reveal_attachments.source_type` style, different domain)
- Anything not on the locked list (surface to founder if you think the v1 set is missing a deed type)

**What Phase 3 still owns:** reconciling the parent-level form on `reward_reveal_attachments.source_type` (translating between event-level deed firings and parent-level reveal attachments) is genuinely Phase 3's problem. Workers don't touch that table.

### 2.11 — Pacing is the founder's job; don't suggest stopping

**Plain English:** the founder decides when to stop, when to break, when to dispatch the next worker, when to rest. You do not. Sequencing decisions go by dependency, not by "you've shipped a lot, want to take a break."

**Why:** the founder has been clear that "you've done a lot today, want to stop?" framing actively hurts her ability to lead the build. It puts her in the position of justifying continuing, when she's already made the decision to continue. Her time, her energy, her call. The worker's job is to ship sub-tasks competently, report back honestly, and present next-step options on merit.

**For builders:** never suggest stopping, pausing, taking a break, ending the session, or "wrapping up for the day." Never qualify a successful sub-task report with "this might be a good place to stop." Never frame a next-step recommendation around founder energy or time-of-day. Present what the next step is on its own merits — dependency, sequencing, scope, risk — and let the founder pick the pace.

If the founder explicitly asks "should we stop here?" you can answer the merit question (e.g., "the next sub-task has a meaningful schema migration — fine to pause OR continue, both are clean break points"). Don't volunteer the framing.

This principle applies to every dispatch prompt for every worker on every phase. Convention candidate.

---

## 3. Per-Worker Coordination Sections

Each section below is paste-ready — copy the relevant section into the worker's dispatch prompt.

### 3.1 — Worker 5 (Painter / Universal Scheduler Upgrade)

**Paste this entire section into Worker 5's dispatch prompt.**

> **Coordination context: you are building a cross-cutting Lego primitive that several other builds depend on. Read this section carefully before architecting.**
>
> **The Painter is not a separate primitive parallel to Universal Scheduler.** It is a NEW INPUT METHOD added to Universal Scheduler. Painting is one way to author a schedule; recurrence patterns are another way. Both produce the same kind of `SchedulerOutput`. Downstream consumers (tasks, routines, lists, calendar events, the connector layer) see one shape regardless of how mom authored it.
>
> **Why this architectural choice:** building Painter as a separate primitive parallel to Universal Scheduler creates a fork that we'd spend the next year reconciling. Universal Scheduler is the right home for "express any kind of schedule." Painter is a paint-on-calendar input mode; the scheduler is the storage and dispatch mechanism.
>
> **Required design constraints for Worker 5:**
>
> 1. **Universal Scheduler gains a "painted-calendar" input mode.** Mom can paint days directly on a calendar UI as an alternative to picking recurrence patterns. The painting UI produces output in the existing `SchedulerOutput` shape (RRULE + dtstart + exdates + rdates + timezone), with painted dates expressed as explicit `rdates` (specific dates) rather than as a recurring pattern. Or — if the painting reveals a clear recurrence (every Sunday), the system can offer to convert it to a recurrence pattern.
>
> 2. **Per-date assignee mapping is a schedule-level optional field.** Painted assignments can carry per-date assignee mappings (Sun=Mosiah, Tue=Mosiah, Wed=Helam, Thu=Helam). This is OPTIONAL — most schedules don't need per-date assignees (a daily task with a fixed assignee doesn't need painting). When per-date assignees are set, they live in the `SchedulerOutput` blob as additional metadata (e.g., `assignee_map: {"2026-05-03": "mosiah-uuid", "2026-05-05": "helam-uuid"}`).
>
> 3. **Assignee is a property of the consumer, not the schedule.** When a painted schedule is referenced by multiple consumers (two routines using the same painted schedule), each consumer can have its own assignee mapping. The schedule provides the WHEN; the consumer provides the WHO. Per-date assignee mappings on the schedule are a default that consumers can override.
>
> 4. **Optional time-of-day windows on painted schedules.** Painted assignments can carry `active_start_time TIME NULL` and `active_end_time TIME NULL`. If set, the synthetic deed firing happens at start_time (in family timezone). If not set, fires at family midnight. End_time can be used to express "the painted assignment expires later in the day" (rare but useful for some morning-only patterns).
>
> 5. **The Painter must support attaching to LISTS, not just tasks/routines.** Mom should be able to paint "Big Saturday Opportunity List is active on first Saturdays" — the list becomes browseable on those days and hidden on others. Worker 3 reads painted schedules attached to lists to determine list visibility. (If lists don't yet support attached schedules, Worker 5 adds the necessary column/relationship.)
>
> 6. **Worker 5 OWNS the deed-firings table — creates it and writes real firings.** When a painted day arrives (or a non-painted scheduled occurrence activates) for a kid+assignment, Worker 5 inserts a row into the deed-firings table. The row carries `(source_type='scheduled_occurrence_active', source_id=<scheduled-occurrence-id>, family_member_id=<kid>, fired_at=<timestamp>)`. The `source_type` string is locked to verb-form per cross-cutting principle §2.10 — use `scheduled_occurrence_active` verbatim.
>
>    **Worker 5 creates the deed-firings table itself**, per the Phase 3 schema design (see `claude/web-sync/Connector-Architecture-and-Routing-Model.md` and `Connector-Build-Plan-2026-04-26.md` §6.2 sub-task 2). This was decided 2026-04-26 after the pre-parallel investigation: rather than no-op until Phase 3, Worker 5 ships the table so painted-day firings are observable the day Worker 5 lands. Phase 3 inherits the table and adds dispatch infrastructure (contracts evaluation, godmother routing) on top.
>
>    **Implementation pattern:** push, not pull. Insert the deed firing at the moment the painted occurrence becomes active, computed in family timezone. Don't add a new cron sweep — piggyback on the painter's own scheduling logic (a per-family-timezone scheduler check is the canonical way). If you genuinely need a cron pull as a backstop, slot `:20 * * * *` is free and avoids the existing `:00`–`:15` cluster.
>
>    **Until Phase 3 ships:** firings land in the table but no contracts evaluate them — that's expected and fine. The observability (rows accumulating in the table) is itself the deliverable.
>
> 7. **Family timezone respected throughout.** No UTC for time-of-day logic. Use the existing pattern from `family_circles.timezone` and `calculate-allowance-period/index.ts:172-189`.
>
> 8. **Instantiation mode question in the wizard.** When mom paints a schedule and attaches multiple assignees, surface this question explicitly: "Each kid does their own (per-assignee instance), OR shared with anyone-completes (shared instance)?" Per cross-cutting principle §2.3.
>
> 9. **Use the Universal People Picker** for assignee selection. Don't build a worker-local people picker.
>
> 10. **Templates produced by the wizard carry community-readiness fields.** Per cross-cutting principle §2.7. Even if community sharing isn't built, the schema fields should be there.
>
> **Things Worker 5 should NOT do:**
>
> - Don't build a separate Painter primitive parallel to Universal Scheduler. Painter is a mode of the scheduler.
> - Don't reinvent recurrence representation. If the painted dates have a clear pattern, use the existing RRULE mechanism.
> - Don't bake assignee identity into the schedule output as a required field. It's optional metadata.
> - Don't dispatch godmothers directly. The connector layer (Phase 3) owns dispatch. Worker 5 just writes deed firings.
>
> **Coordination with other builds:**
>
> - **Workers 2 + 3 (Shared Routines + Shared Lists)** — your painted schedules will be referenced by their primitives. Coordinate on the assignee-mapping handoff: when a painted schedule has per-date assignees AND the consumer (routine/list) is shared, the per-date assignee determines who the deed firing is for. Workers 2 + 3 also write deed firings to the table you create — coordinate on table schema and migration ordering so their firings land cleanly the day they ship.
> - **Phase 3 (Connector Layer)** — Phase 3 inherits the deed-firings table you ship and adds contracts evaluation + godmother dispatch on top. Don't worry about contract-side schema; just ship the firings table per the Phase 3 design doc.
> - **Phase 3.7 (Wizards)** — Phase 3.7's chart wizards may produce contracts that wire to `scheduled_occurrence_active` deeds from your painted schedules. Make sure your synthetic-deed schema is documented for Phase 3.7's reference.
>
> **Plain English of what mom experiences if you ship correctly:** mom can paint custom schedules on a calendar (for any weird pattern that doesn't fit standard recurrence). She can attach routines, tasks, or lists to those painted schedules. When she attaches multiple kids, she's asked whether each kid does their own version or whether it's shared. The same painted schedule can be reused across multiple consumers. When the connector layer lands later, contracts wired to those painted days start firing automatically — your work is forward-compatible.

### 3.2 — Workers 2 + 3 (Shared Routines + Shared Lists)

**Paste this section into Workers 2 + 3 dispatch prompts.**

> **Coordination context: you are building the shared-execution model that the connector layer's wizards will compose against. Your sharing-mode and instantiation-mode shapes become the canonical infrastructure for ALL shareable primitives in the app.**
>
> **Required design constraints:**
>
> 1. **Sharing mode follows the four-mode matrix per cross-cutting principle §2.2.** Schema column on routines and lists: `sharing_mode TEXT NOT NULL` with values `'single_owner_single_use'`, `'single_owner_multi_use'`, `'multi_owner_single_use'`, `'multi_owner_multi_use'`. The matrix is the matrix; don't add a fifth mode.
>
> 2. **Instantiation mode follows cross-cutting principle §2.3.** When a routine or list is attached to multiple assignees, the schema captures whether each assignee has their own instance or whether it's shared with anyone-completes. Schema column: `instantiation_mode TEXT` with values `'per_assignee_instance'` and `'shared_anyone_completes'`. Worker 5's painting UI surfaces this question to mom; your execution layer respects the choice.
>
> 3. **Track the actual completer for shared instances.** When `instantiation_mode='shared_anyone_completes'`, completion records carry the actual completer's `family_member_id`. Allowance credit, points, victories, and any other downstream rewards go to the actual completer, not split across the pool.
>
> 4. **Categories per cross-cutting principle §2.4.** Routines and lists carry a `category TEXT` column (mom-defined values, not a fixed enum). The category vocabulary is per-family; don't hardcode taxonomies.
>
> 5. **Polymorphic source addressing per cross-cutting principle §2.1.** Where you reference other primitives (e.g., a routine step that links to a list, a list item that links to a sequential collection), use `(source_type, source_id)` rather than typed FKs. This is the existing convention in the Composition Architecture doc Section 1.3 (linked routine steps, linked list items).
>
> 6. **Every list completion / routine step completion writes a deed firing.** When something completes, you write a row to the deed-firings table (created by Worker 5; see §3.1 item 6): `(source_type='list_item_completion' or 'routine_step_completion', source_id=<the-item-id>, family_member_id=<actual-completer>, fired_at=<timestamp>)`. The `source_type` strings are locked to verb-form per cross-cutting principle §2.10 — use `list_item_completion` and `routine_step_completion` verbatim. If Worker 5 hasn't shipped yet, coordinate with the founder on table-creation ordering; the firings should be real (not no-op) by the time you ship.
>
> 7. **For shared lists with sub-categorization (role-scoped segments per the consequence list pattern):** the schema must allow some items to be visible only to certain assignees (e.g., big-kids-only consequences). Consider a `visible_to_member_ids UUID[] NULL` or similar per-item filter. The Composition Architecture doc Section 1.3 discusses this pattern.
>
> 8. **Browsable vs hidden is a per-list mom choice.** Schema: `is_browsable BOOLEAN`. Default depends on list type (consequences default false; opportunities default true), but mom overrides per list.
>
> 9. **Templates carry community-readiness fields per §2.7.**
>
> 10. **Use the Universal People Picker** for roster selection. Don't build a worker-local people picker.
>
> **Things Workers 2 + 3 should NOT do:**
>
> - Don't invent a fifth sharing mode. The four-mode matrix is the matrix.
> - Don't bake "this is for one kid only" assumptions into shared primitives. Every shareable primitive must support all four sharing modes from day one (the schema, at least; the UX can default to common cases).
> - Don't dispatch godmothers directly. The connector layer owns dispatch. Workers 2 + 3 just write deed firings.
>
> **Coordination with other builds:**
>
> - **Worker 5 (Painter)** — painted schedules can be attached to your routines and lists. Coordinate on the assignee-mapping handoff (per-date assignees from the schedule + roster from the routine/list = who's actually on the hook for each occurrence).
> - **Worker 4 (Lists Template Deploy)** — uses your sharing-mode and instantiation-mode infrastructure. Make sure templates can carry these properties so deployments inherit them.
> - **Phase 3 (Connector Layer)** — consumes your deed firings.
> - **Phase 3.7 (Wizards)** — composes lists and routines into wizard templates. Make sure your primitives are wizard-friendly (clean APIs for "create from template," "deploy to family," "deploy to specific assignee with sharing mode").
>
> **Plain English of what mom experiences if you ship correctly:** mom can create lists and routines that are shared across kids (or not, her choice). For shared ones, she picks whether each kid has their own instance or whether anyone in the pool can satisfy it. The actual completer gets the credit. The connector layer wires up rewards downstream.

### 3.3 — Worker 4 (Lists Template Deploy)

**Paste this section into Worker 4's dispatch prompt.**

> **Coordination context: you are the smallest of the parallel builds, but your template-deploy infrastructure is what wizards (Phase 3.7) and community templates (someday) will rely on.**
>
> **Required design constraints:**
>
> 1. **Use the sharing-mode and instantiation-mode infrastructure established by Workers 2 + 3.** Don't reinvent. Your deployments inherit these properties from the template definition.
>
> 2. **Templates carry community-readiness fields per cross-cutting principle §2.7.** Even though you're building list-template deploy specifically, the same template-source / cloned-from / original-author pattern applies.
>
> 3. **Polymorphic source addressing per §2.1** for any references between templates, deployments, and live primitives.
>
> 4. **Categories per §2.4** carry through from template to deployment.
>
> **Things Worker 4 should NOT do:**
>
> - Don't reinvent sharing-mode infrastructure. Use what Workers 2 + 3 established.
> - Don't introduce new categories of "deploy" mechanism. Use the existing Studio template deploy patterns.
>
> **Coordination with other builds:**
>
> - **Workers 2 + 3** — direct dependency. Land after them or coordinate explicitly on the sharing-mode shape.
> - **Phase 3.7 (Wizards)** — your template-deploy infrastructure is what wizards use to deploy configured templates to families.

### 3.4 — Connector Layer (Phase 3 / 3.5 / 3.7)

**This section is informational for the other builders; the full Phase 2 build plan covers Connector Layer scope in detail.**

> **What the Connector Layer is doing:**
>
> Phase 3 ships the central switchboard — a `contracts` table that wires deeds (events from your primitives) to godmothers (actions that grant rewards / create tasks / write victories / etc.). Phase 3.5 restructures the allowance system for multi-pool support. Phase 3.7 ships the first wizards (Repeated Action Chart Wizard + List + Reveal + Assignment Wizard) plus a Rewards List Wizard plus seeded templates for Potty Chart, Consequence Spinner, and Extra Earning Opportunities.
>
> **What the Connector Layer NEEDS from your builds:**
>
> - **Deed firings written to the deed-firings table** when events happen in your primitives. The table is created by Worker 5 (see §3.1 item 6); Phase 3 inherits it and adds contracts evaluation + dispatch on top. All firings use the locked verb-form `source_type` strings per §2.10.
> - **Sharing mode and instantiation mode** on shareable primitives so contracts can correctly interpret deed firings.
> - **Categories** on primitives so contracts can wire at the category level.
> - **Polymorphic source addressing** so contracts can point at your primitives uniformly.
> - **Templates with community-readiness fields** so the wizard library is forward-compatible.
> - **Use of the cross-cutting UI primitives** (people picker, scheduler, timer, etc.) so the wizards can compose with your surfaces seamlessly.
>
> **Pre-existing infrastructure gaps Phase 3 inherits (informational, not parallel-worker concerns):**
>
> - **`accrue-loan-interest` Edge Function is no-op in production** (REWARDS_GROUND_TRUTH §1.1 row 6). The cron schedule fires hourly at `:15` but the function either doesn't exist or returns no-op. Loans accrue zero interest today. Phase 3 will touch this when wrapping `money_godmother`. Flag so the gap is not later misattributed to "Phase 3 broke loans."
> - **Three different `source_type` naming styles coexist** in the existing schema (parent-level on `reward_reveal_attachments`, past-tense on `victories.source`, verb-form for the locked v1 deed set). Phase 3 owns the reconciliation when wiring reveal-as-presentation — translating between event-level deed firings and parent-level reveal attachments. Workers don't touch this.
> - **`advance-task-rotations` and `expire-penciled-in-events` use UTC `CURRENT_DATE`** instead of family timezone. Pre-existing limitation. Phase 3's daily-cadence sweepers should not repeat the pattern — derive from family timezone per §2.6.
>
> **What the Connector Layer will NOT do:**
>
> - Won't redesign your primitives. We consume what you build.
> - Won't bypass your APIs. Contract-driven actions invoke your normal APIs (creating tasks, writing list completions, etc.) rather than touching your tables directly.
> - Won't ship before your builds. Phase 3 lands after the relevant primitives exist.

---

## 4. Coordination Timeline (Best-Effort, Subject to Change)

This is the current expected sequence. Adjust as builds land or shift.

```
Worker 5 (Painter / Universal Scheduler upgrade) ──┐
                                                    │
Workers 2 + 3 (Shared Routines + Lists)  ──────────┤
                                                    │
Worker 4 (Lists Template Deploy)         ──────────┤
                                                    ▼
                  Phase 3 (Connector Layer + baseline UI + 9 godmothers)
                                                    │
                                                    ▼
                  Phase 3.5 (Multi-pool allowance restructure)
                                                    │
                                                    ▼
                  Phase 3.7 (Rewards List Wizard + Two Chart Wizards + 3 templates)
```

Phase 3 can technically start before all parallel workers ship, but it lands cleaner if the deed-producing primitives (lists, routines, painted schedules) exist first so the migration writes contracts that mirror real production data.

If timing forces Phase 3 to ship before some parallel workers, the connector layer ships with stub support for those source_types (the schema accepts them; nothing fires deed firings yet). When the parallel workers ship, they wire their firings into the existing infrastructure.

---

## 5. Future Coordination Points (Forward-Looking)

These are not active builds but should inform current architectural decisions.

### 5.1 — Community templates (future)

Per cross-cutting principle §2.7, templates carry community-readiness fields from day one. The actual community sharing UX (browse, search, clone, customize, deploy) is a future build. Schema is ready; UI is not.

### 5.2 — LiLa-driven wizard authoring (future)

Eventually mom may say to LiLa: "Set up a potty chart for Ruthie with treasure box reveals every 5 trips and a special prize at 50." LiLa parses the natural-language description, populates the appropriate wizard, presents it to mom for review, mom approves, deployment happens. This is post-Gate-2 flagship work. The current wizard infrastructure (Phase 3.7) is the substrate LiLa will eventually drive.

### 5.3 — Source-category-scoped contracts (refinement, not new feature)

Per cross-cutting principle §2.4, the initial implementation supports `source_category` filtering on contracts. Future refinements may add multi-category wiring ("any deed in source_category='reading' OR source_category='math' counts toward extra credit"). The schema supports it; the UX may need iteration.

### 5.4 — Workflow-engine debugging surface (future)

As the connector layer accumulates more contracts and more deed firings, mom may need a "fire history" view to debug why something fired (or didn't). This is a post-Phase-3.7 feature. The connector layer's logging during Phase 3 should be designed with this future surface in mind (every deed firing logged; every contract evaluation logged with qualifying/not-qualifying outcome; every godmother dispatch logged with status).

---

## 6. What This Brief Is Not

- **Not a replacement for individual worker dispatch prompts.** Each worker still gets a full dispatch prompt with PRD references, build steps, etc. This Brief is the cross-cutting context that goes alongside.
- **Not a feature spec.** It's architectural coordination. Specific feature details live in the relevant PRDs and worker plans.
- **Not exhaustive.** New coordination points may surface during builds. When they do, surface them to the founder so this Brief can be updated.

---

## 7. Project Knowledge Sync Notes

When this Brief is committed to the repo, update the project knowledge:

- **ADD:** `Parallel-Builder-Coordination-Brief-2026-04-26.md` (this doc)
- **ADD:** `Connector-Build-Plan-2026-04-26.md` (the Phase 2 build plan, drafted alongside)
- **DO NOT REMOVE:** `Connector-Architecture-Master-Plan.md`, `Connector-Architecture-and-Routing-Model.md`, `Composition-Architecture-and-Assembly-Patterns.md` — all three remain authoritative.

---

> **End of Brief.**
>
> This is a living document. Update as builds land and coordination requirements evolve. Every parallel worker should reference the relevant section before architecting; every dispatch prompt should include a paste of the relevant section.
