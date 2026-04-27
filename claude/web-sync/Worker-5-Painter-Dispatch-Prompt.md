# Worker 5 — Painter / Universal Scheduler Upgrade Dispatch Prompt

> **Status:** ready to paste into a fresh Claude Code session. Do not edit without re-reviewing against the Coordination Brief §3.1 and Convention §2.10 (verb-form lock).
>
> **Use:** open a fresh Claude Code session in `c:\dev\MyAIMCentral-family\MyAIMCentral-family`, paste the prompt below verbatim, and let Claude Code start its pre-build ritual.

---

## Paste-ready prompt for Claude Code

```
You are Worker 5 (Painter / Universal Scheduler Upgrade) in a coordinated multi-worker build sequence for MyAIM Family. You're being dispatched FIRST because your work is foundational — every other worker (and Phase 3 onward) depends on the scheduler upgrade and the deed-firings table you're about to ship.

# Step 1 — Orientation (mandatory before any other work)

Read this file in full:

  claude/web-sync/Connector-Build-Sequence-Orientation.md

It explains where Worker 5 fits in the larger build sequence, what's coming after you (Workers 2+3, Worker 4, Phase 3, Phase 3.5, Phase 3.7), and the working pattern (one commit per sub-task, founder approval between sub-tasks, plain-English mandatory, no backward-compat scaffolding, no suggesting stopping points).

After reading the orientation, confirm to the founder in chat:
  "Orientation read. I am Worker 5 (Painter / Universal Scheduler Upgrade). Ready to read required materials."

Wait for founder acknowledgment before continuing.

# Step 2 — Required reading (in this order, before any code)

1. claude/web-sync/Parallel-Builder-Coordination-Brief-2026-04-26.md
   - Read §1 (mental model) in full
   - Read §2 (cross-cutting design principles) in full — every sub-section applies to you
   - Read §3.1 in full (your paste-ready coordination block)
   - §2.10 is the verb-form source_type lock — HARD CONSTRAINT for your work
   - §2.3 is instantiation mode — directly affects your Painter wizard UX
   - §2.6 is family timezone — directly affects your push-pattern firing logic

2. claude/web-sync/Connector-Architecture-and-Routing-Model.md
   - The Phase 1 design. Schema for the deed-firings table is here. You need to match this schema when you create the table (per Coordination Brief §3.1 item 6, Worker 5 OWNS deed-firings table creation).
   - Read the vocabulary section (deeds, contracts, godmothers, stroke_of, payload).
   - Read the deed-firings table schema specifically.

3. claude/web-sync/Connector-Architecture-Master-Plan.md
   - Phase structure overview. Skim — useful background, not deep dependency.

4. claude/web-sync/Composition-Architecture-and-Assembly-Patterns.md
   - The upstream architectural vision. Read §1.3 specifically (linked routine steps / linked list items use polymorphic source addressing — same pattern your scheduler outputs need to play well with).

5. claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md
   - Forensic report on existing scheduler / cron / connector-relevant infrastructure. Read in full — it tells you what already exists vs what's stubbed.
   - Pay attention to §2 (multi-pool feasibility background, useful context) and any section discussing Universal Scheduler / scheduler outputs / RRULE handling.

6. claude/feature-decisions/Worker-5-Painter-Review-Checklist.md
   - Forward-looking concerns the founder will check at your sign-off review. Specifically the multi-assignee deed firing semantics question. Don't ship without an explicit answer to it.

7. CLAUDE.md and claude/PRE_BUILD_PROCESS.md
   - The non-negotiable conventions and the mandatory pre-build ritual. The pre-build ritual is required before any code work — no exceptions.

# Step 3 — Pre-build ritual (mandatory)

Follow claude/PRE_BUILD_PROCESS.md. Specifically:

- Step 0 — Tool health check (mgrep is NOT required as of 2026-04-18; use Grep/Glob)
- Step 1 — Identify full source material. The PRD-relevant materials for Worker 5 are:
  - PRD-35 (Universal Scheduler) and any PRD-35 addenda in prds/addenda/
  - PRD-09A (Tasks/Routines) — for understanding scheduler consumers
  - PRD-09B (Lists) — for understanding the "paint a schedule onto a list" pattern (Coordination Brief §3.1 item 5)
  - PRD-14B (Calendar) — for understanding existing calendar UI primitives the Painter may compose with
  - All "always-relevant" addenda named in PRE_BUILD_PROCESS.md Step 1 (Permission Matrix, Cross-PRD Impact for PRD-35, Audit Readiness)
- Step 2 — Create feature decision file at claude/feature-decisions/Worker-5-Painter-Universal-Scheduler-Upgrade.md
- Step 3 — Create active build file at .claude/rules/current-builds/worker-5-painter-universal-scheduler-upgrade.md (no YAML paths: frontmatter)
- Step 4 — Present pre-build summary to founder for explicit approval
- Step 5 — Only then write code

The pre-build summary must answer at minimum:

A. Scope clarity
   - What sub-tasks does Worker 5 ship? Numbered, in dependency order. (Suggested starting point below — refine based on your investigation.)
   - What's the deed-firings table schema you'll create? Match Connector-Architecture-and-Routing-Model.md.
   - What does the Painter UI look like at minimum (sketches, descriptions, or component breakdowns)?
   - How does the Painter integrate with existing Universal Scheduler? Coordination Brief §3.1 item 1 says it's a NEW INPUT MODE, not a parallel primitive.
   - Per-date assignee map: where does it live in SchedulerOutput? Schema design.
   - Time-of-day windows on painted schedules: schema design.
   - Painter attached to lists: where does the relationship live (column on lists table? join table?)?

B. Forward-looking checklist concerns (Worker-5-Painter-Review-Checklist.md)
   - Multi-assignee firing semantics: what does Worker 5 actually write when a painted day has N assignees? One firing per assignee with each kid's family_member_id, or something else? Founder needs an explicit answer in the pre-build summary, NOT deferred to mid-build.
   - Family timezone: how is the painted-day-arrival check implemented? Push pattern (per-family-timezone scheduler check) is recommended; pull-pattern cron fallback at slot :20 is allowed if needed.

C. Verb-form lock per Coordination Brief §2.10
   - Confirm: every deed firing Worker 5 writes uses source_type='scheduled_occurrence_active' verbatim. No past-tense, no parent-level form.

D. Instantiation mode UX (Coordination Brief §2.3)
   - When mom paints a schedule and attaches multiple assignees, where in the wizard does the "each kid does their own" vs "shared, anyone-completes" question appear? Mockup or component description.

E. Coordination handoffs
   - Workers 2 + 3 will write list_item_completion and routine_step_completion firings to the deed-firings table you create. What's the schema contract with them? They need to know column names and types before they ship.
   - Phase 3 inherits the table. What schema fields are reserved for Phase 3 (e.g., contract_id reference, dispatch status) vs core to Worker 5?

F. Stub registry
   - Anything you're NOT building that the PRD or addenda require — name it, register it as a stub, ensure it's documented for future work.

# Step 4 — Sub-task sequence (suggested — refine in pre-build summary)

This is a starting point. Your investigation may reveal a better order. Surface to founder.

1. Schema: deed-firings table (per Phase 1 design). Migration with idempotency keys, indexes for fast contract lookup, RLS policies. Verb-form source_type strings as the only allowed values for v1 (loose CHECK or no CHECK — Phase 3 will tighten).
2. Schema extensions: per-date assignee map, time-of-day window columns on the existing scheduler-output storage (research existing schema during pre-build to find where SchedulerOutput is persisted).
3. Schema extensions: lists.scheduled_via_id (or equivalent) so Painter can attach to lists.
4. Universal Scheduler upgrade: painted-calendar input mode. UI integration with the existing scheduler component.
5. Painter wizard UX: per-date assignees, time-of-day windows, instantiation mode question, list attachment option.
6. Painter wizard: convert-to-recurrence detection (if painted dates have a clear pattern, offer to convert to RRULE).
7. Push-pattern deed firing: per-family-timezone trigger (or scheduled check) that inserts deed firings into the table when a painted occurrence becomes active.
8. (Optional fallback) Pull-pattern cron sweep at :20 if push pattern can't cover all cases.
9. Tests + visual verification across all scenarios in Coordination Brief §3.1.
10. Documentation updates: WIRING_STATUS.md (add scheduled_occurrence_active firing path), CLAUDE.md (any new conventions), live_schema.md (regen via npm run schema:dump).

Sub-tasks 1, 2, 3 are migrations and may be combined into a single migration commit if logically related.

# Step 5 — Working pattern reminders

- One commit per sub-task. Report to founder. Wait for approval. Move to next.
- Plain English mandatory in every report. "What this means for mom" framing alongside technical details.
- Visual Verification Standard: open the browser, hard reload, eyes-on confirmation before marking anything Wired.
- No suggesting stopping points. Founder paces. You sequence by dependency.
- Family timezone everywhere. No UTC for time-of-day logic.
- No backward-compat scaffolding. Founder's family is the only production family.
- If you discover scope expansion ("we should also build X while we're here"), surface it to founder. Don't silently expand.
- If you find a real flaw in the locked design, surface it to founder. Don't quietly work around it.

# Step 6 — Things to NOT do

- Don't build a separate Painter primitive parallel to Universal Scheduler. Painter is a NEW INPUT MODE of the scheduler.
- Don't reinvent recurrence representation. RRULE already exists.
- Don't bake assignee identity into the schedule output as a required field — it's optional metadata.
- Don't dispatch godmothers directly. The connector layer (Phase 3) owns dispatch. You just write deed firings.
- Don't skip the pre-build ritual. The founder will not approve code that wasn't preceded by a pre-build summary.
- Don't write deed firings with source_type='scheduled_occurrence' or 'painted_day' or any string other than 'scheduled_occurrence_active'. Verb-form is locked.

# Final note

The architecture has been carefully designed across two phases of long planning sessions plus a pre-parallel investigation that surfaced (and resolved) the naming-style risk and the deed-firings table ownership question. When something feels arbitrary, it's because the reasoning lives in the documents above. Read them.

When you've completed Step 1 (orientation read), report back with the confirmation phrase and wait for founder acknowledgment.
```

---

## Notes for the founder before pasting

- Open a **fresh** Claude Code session in `c:\dev\MyAIMCentral-family\MyAIMCentral-family`. Don't reuse this session — Worker 5 should start cold against the source-of-truth documents, not pick up context from this orchestration session.
- Paste everything between the triple-backtick fences (the `# Step 1...` through `wait for founder acknowledgment`) into the fresh session. Do not include the "Notes for the founder" section.
- Worker 5 will pause after orientation and wait for your acknowledgment. That's your first checkpoint — confirm orientation took, then let it proceed to Step 2 (required reading).
- The next checkpoint is the pre-build summary at end of Step 3. That's where you review the multi-assignee firing semantics answer (the headline concern from the pre-parallel investigation) before any migration runs.
- After pre-build approval, Worker 5 commits per sub-task and reports back. You approve each before the next.
