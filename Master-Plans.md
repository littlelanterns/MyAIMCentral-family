# Master Plans — Composable Multi-Faceted Planning Surfaces

**Status:** Draft v1 for founder review, 2026-04-29
**Source session:** Universal Capability Parity scoping conversation with Tenise (2026-04-29)
**Related docs:** `Universal-Capability-Parity-Principle.md`, `Composed-View-Surfaces-and-Wishlists.md`, `Composition-Architecture-and-Assembly-Patterns.md`, `Connector-Architecture-and-Routing-Model.md`, `Linked-Steps-Mastery-Advancement-Addendum.md`

**Status of implementation:** OUT OF SCOPE for the immediate parity work and for Workers 2/3/4. This doc captures design intent so current builds can stay extensible enough to accommodate this layer when it ships.

---

## What Master Plans is

A Master Plan is mom's planning surface for any multi-faceted real-life context where she has many people, many activities, mixed shared and per-member content, mixed sources feeding mixed sections, and a need to edit it all from one place.

It's not a single feature called "the Master Schedule." It's a **pattern** mom applies to whatever planning surface she has. Real cases the founder named:

- **Homeschool planner** — sections per subject, per-kid linked sources for individual curriculum, shared sections for co-op/devotional/memorization
- **Trip planner** — sections for transport, lodging, packing, activities, with different resources/tasks/schedules per traveler
- **Summer bucket list** — single shared list with everything for everyone in one place, items for various people surfaced contextually
- **Annual or monthly task schedule** — recurring household work distributed across members, managed centrally
- **Holiday planner** — gift coordination, meal planning, schedule of events, per-person tasks and shared tasks
- **School-year-launch planner** — supplies, registrations, schedules, transitions
- **Birthday party planner** — invitations, food, activities, gifts, kid-specific responsibilities

These are all the same architectural shape: **a parent container with sections, where each section can be configured for shared content or per-member content, with linked sources feeding the per-member sections.** Mom builds one, edits it in one place, the right thing surfaces to the right person automatically.

## Mom can have as many as she needs

The architecture isn't "one Master Plan per family." Mom creates a Master Plan whenever she has a multi-faceted planning context that benefits from this shape. Mom's homeschool Master Plan is separate from her summer bucket list Master Plan is separate from her annual chore Master Plan. Each lives independently. Each has its own structure suited to its purpose.

## How this maps to existing architecture

This isn't entirely new infrastructure. Most pieces already exist:

| Master Plan concept | Existing primitive |
|---|---|
| The container | Routine |
| Sections within a Master Plan | Routine sections (already support different frequency per section) |
| Section content that's shared across all members | Static routine step OR linked routine step pointing at one shared source |
| Section content that's per-kid | Routine step linked to per-assignee sources (NEW — see below) |
| Schedule per section | Routine section frequency_rule + frequency_days (already exist) |
| Mixed shared + per-kid sections | Already supported by per-step capabilities (per File 1) |
| Per-kid daily/weekly view | Routine deployment per kid (already exists) |

The "Master Plan" is a routine, deployed to all the kids who need it, with sections of mixed sharing modes, where some steps are shared content (one source feeds everyone) and other steps are linked to per-kid sources (each kid's step links to their own curriculum collection).

## What's actually new

Three pieces the current code doesn't have:

### 1. Per-kid linked sources at step level

Today, `task_template_steps.linked_source_id` is a single FK pointing at one source. The step renders THAT source for every kid who runs the routine.

What Master Plans needs: **one step ("Math") that resolves to Mosiah's collection when Mosiah views it, Helam's collection when Helam views it, Maya's collection when Maya views it.**

This is a per-assignee linked source — a junction layer between the step and per-kid collection IDs. Doesn't exist today as a clean primitive.

**Likely shape:** A new junction table `task_template_step_assignee_sources`:
- step_id (FK → task_template_steps)
- family_member_id (FK → family_members)
- linked_source_id (FK to whichever source — sequential collection, list, etc.)
- linked_source_type ('linked_sequential' / 'linked_randomizer' / 'linked_task')
- per-assignee config (which day they see it, how many drips, browsable flag, extra credit flag, life_area_tags, etc.)

When the routine renders for a kid, the step's source is resolved by looking up that kid's row in this junction table. If no row exists for that kid, the step either uses the default `linked_source_id` (if mom set one as the fallback) OR doesn't render for them.

This pattern is familiar — it's how `task_assignments` works for tasks (a junction table mapping member to task). Same architectural shape applied to step-source assignment.

### 2. Master Plan editing surface

A view that shows the routine with all sections, all steps, and per-kid source assignments visible in one place. Mom can:

- Add/remove/edit sections
- Add/remove steps within sections
- Configure step-level capabilities (sharing, schedule, allowance, life_area_tags, etc.)
- Pick the source feeding each per-kid step ("Math: Mosiah → Saxon 6/5, Helam → Saxon 7/6, Maya → Singapore 3A")
- Configure per-kid step settings (which days they see it, how many drips, browsable flag, extra credit, etc.)
- See at a glance who each step is currently assigned to (the routine context view enhancement from File 1)

This editing surface uses the routine context view pattern (File 1) — full-routine view with focused-step inline edit — extended to handle per-kid source assignment. Each step in the editing surface shows which sources feed it for which kids, with quick controls to reassign.

### 3. Wizards for new Master Plan types

When mom creates a new Master Plan, a wizard helps her shape it:

- What kind of Master Plan? (Homeschool / Trip / Bucket List / Annual Tasks / Holiday / Custom)
- Who's involved? (Family members)
- What sections? (Suggested per type, customizable)
- For each section: shared or per-member? Schedule? Sources?

Built Master Plans become reusable templates — first for the family (next year's homeschool, next summer's bucket list), then shareable to other families through Studio's template marketplace. Other families use mom's templates as starting points for their own.

## Section types within a Master Plan

A Master Plan has sections, each configured independently. Likely section types:

- **Shared content section** — every member sees the same content (co-op subjects, family devotional, family memorization). Steps within use shared linked sources or static content.
- **Per-member content section** — each member sees their own content (individualized math, individualized reading list, per-kid responsibilities). Steps within use per-kid linked sources via the junction table.
- **Mixed section** — some steps shared, some per-kid (e.g., a "School" section where "Today's Memory Verse" is shared but "Math" is per-kid).
- **Browsable section** — kids can see ahead in the section, not just today's slice. Per-kid browsable flag.
- **Roster-restricted section** — section only visible to specific members (e.g., "Older Kids Only" or "Mom & Dad").

The section configuration carries the schedule (frequency_rule + frequency_days), the sharing default for steps within, and the per-section config flags.

## How a kid's daily view assembles from a Master Plan

When a kid views their daily routine, the system:

1. Reads the Master Plan (routine) the kid is deployed to
2. For each section: check if section's frequency_rule includes today; check roster restriction; if section applies, render its steps
3. For each step: check if it's shared content (single source, render for everyone) or per-kid (look up this kid's assigned source via the junction table)
4. Resolve the source's current active item (linked_sequential's active item, linked_randomizer's draw, linked_task's content)
5. Render the step with the resolved content

The kid sees their personalized daily slice. Mom edited in one place; the resolution happens at render time per kid.

## The composed-view aspect

A Master Plan is partly a composed view (per File 2). The Master Plan editing surface pulls together sections that point at sources elsewhere. Mom editing a per-kid linked source from the Master Plan view writes back to that kid's source (same partial two-way editing pattern).

This means:

- Editing a sequential collection's content from the Master Plan view writes to the sequential collection
- Editing a randomizer list's content from the Master Plan view writes to the randomizer list
- Editing the Master Plan's structure (sections, step configs, per-kid assignments) writes to the routine
- All edits propagate appropriately — the source-of-truth is always the underlying primitive

## Sequencing and dependencies

**Master Plans is future work.** It depends on:

- **Connector layer (Phase 3+)** — for per-kid source resolution at runtime in some flows
- **Phase 3.5 multi-pool allowance** — so per-kid sections can route to different pools per kid
- **Studio template marketplace** — so Master Plans become shareable patterns
- **Universal Capability Parity (immediate work + Phase 3.5 sub-build)** — so the per-step capabilities needed are already in place

**This doc exists primarily to constrain current work**, not to specify the future build in full.

## Constraints on current work

Current parity work and Workers 2/3/4 must build extensible enough to accommodate Master Plans when it ships. Specifically (these are examples — see also the meta-principle below):

1. **Per-step capabilities (sharing, schedule, allowance, life_area_tags, etc.) must extend cleanly to per-kid linked source assignments.** When the junction table is added, existing step-level capability resolvers must still work — capabilities resolve from step → section → routine, with per-kid override possible but not required.

2. **Configure Item inline editor and routine context view patterns must work in a Master Plan editing surface.** The patterns shipped in File 1 are the foundation for the Master Plan editor. The Master Plan editor extends them with per-kid source assignment controls; it doesn't replace them.

3. **The instantiation_mode framing must explicitly leave room for "per-kid linked sources" as a future variant.** Today's two values (per_assignee_instance, shared_anyone_completes) are sufficient for routines without per-kid linked steps. When the junction table arrives, a third instantiation_mode (or an orthogonal "linked_source_resolution" property) handles "shared routine structure with per-kid step sources." Don't bake the two-value assumption into hard CHECK constraints that would block extension.

4. **Routine schema must accommodate (without restructuring) a future junction table for per-kid step sources.** The `task_template_steps.linked_source_id` field stays as the default/fallback; the new junction table adds per-assignee overrides without modifying the existing column.

## The meta-principle

**Build extensible enough that future additions don't break what's there.**

The four constraints above are examples of what we currently know we'll need for Master Plans. More will emerge as Master Plans is designed in detail. Current work should treat these as patterns to honor — not as a closed list of constraints.

When making decisions in the current parity build, ask: "Could this decision make Master Plans harder to add later?" If yes, find a more extensible approach. If no, proceed.

Specific patterns to honor:
- **Junction tables, not extra columns**, when adding many-to-many relationships
- **Optional fields with sensible defaults** rather than required fields with rigid semantics
- **Resolver functions with three-tier inheritance** (per File 1) extend more cleanly than ad-hoc inline resolution
- **Per-step capability columns** allow per-step override even if defaults inherit from parent
- **Don't lock instantiation_mode or sharing semantics** to a small enum — leave room for additional modes

## Companion CLAUDE.md convention (proposed text)

> **Master Plans (post-MVP, design intent captured 2026-04-29).** Mom needs composable multi-faceted planning surfaces — homeschool planner, trip planner, summer bucket list, annual chore schedule, holiday planner, etc. Each is a routine with sections that mix shared and per-kid content. The new architectural piece is per-kid linked sources at step level (junction table mapping step + member → source). Out of scope for current parity work and Workers 2/3/4; depends on connector layer and Phase 3.5+ infrastructure. Current builds must remain extensible enough to accommodate this layer. See `claude/feature-decisions/Master-Plans.md` for full design intent. Meta-principle: build extensible enough that future additions don't break what's there.
