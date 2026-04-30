# Stage 1 — Parity Foundation (Schema + Critical Fixes + Resolvers)

## Status: ACTIVE

**Started:** 2026-04-30
**PRDs:** PRD-09A, PRD-09B, PRD-28 (cross-cutting)
**Feature decision files:** Universal-Capability-Parity-Principle.md, Composed-View-Surfaces-and-Wishlists.md, Master-Plans.md
**Discovery reports:** claude/web-sync/Universal-Capability-Parity-Discovery-Report.md, claude/web-sync/Universal-Capability-Parity-Discovery-Report-2.md
**Paused build reference:** .claude/rules/current-builds/workers-2-3-shared-routines-lists-PAUSED.md

## Scope

### Migrations
1. **100187** — `instantiation_mode` TEXT column + `collaboration_mode` TEXT column on `tasks` and `lists`. Backfill from JSONB. CHECK constraints (extensible TEXT, not Postgres enum).
2. **100188** — `life_area_tag` → `life_area_tags` (TEXT[]) on `tasks`, `task_templates`, `victories`, `sequential_collections`. Add `life_area_tags TEXT[]` to `list_items`. GIN indexes. Backfill single values to single-element arrays.
3. **100189** — `list_items.url` → `list_items.resource_url` rename. `list_templates.default_items` JSONB key rename.

### Resolver Functions (new files in src/lib/tasks/)
- resolveRewardProperties.ts
- resolveAllowanceProperties.ts
- resolveHomeworkProperties.ts
- resolveCategorizationProperties.ts
- resolveAccessProperties.ts

### Creation Path Wiring (10 paths)
Each path updated to call appropriate resolvers per R4 audit table.

### TypeScript Type Updates
- Task.life_area_tag → Task.life_area_tags: LifeAreaTag[]
- Task + instantiation_mode, collaboration_mode top-level fields
- ListItem.url → ListItem.resource_url
- List + instantiation_mode, collaboration_mode top-level fields
- SchedulerOutput.instantiation_mode removed (reads from task/list column)

## Locked Decisions (from founder sign-off)
- DQ1: Subtasks do NOT inherit allowance/homework/victory. DO inherit tracking + categorization.
- DQ2: Quick-capture paths (H, I) stay bare. No resolver changes needed.
- DQ3: Routine deploy (Path E) snapshots ALL capability fields at deploy time.
- DQ4: Randomizer spinner (Path F) gets full capability inheritance like Path A.
- DQ5: Sequential track_progress inherits from collection defaults (fix hardcoded false).
- DQ6: Template capability edits follow Now/Next cycle rules (capability = structural-equivalent = defaults to Next cycle).
- DQ7: instantiation_mode JSONB dropped immediately in single commit (option a).
- D1: TEXT with CHECK constraint for instantiation_mode and collaboration_mode.
- D2: Existing is_shared=true rows backfilled to collaboration_mode='solo_claim'.
- D3: life_area_tags backfill now (trivial data volume).
- D4: list_templates.default_items JSONB url→resource_url included in migration.

## R4 Audit Summary
See main conversation for full table. Key gaps:
- Path E (routine duplicate): biggest gap — only 8 fields set, needs full capability snapshot
- Path F (randomizer spinner): 9 fields set, needs full capability inheritance
- Path A (opportunity claim): missing allowance, homework, categorization, partial access
- Paths C, D (sequential): missing reward, allowance, homework, access; track_progress hardcoded false
- Path J (horizon breaker): missing tracking inheritance (bug vs Path G)

## Post-Phase Checklist
- [ ] tsc -b clean
- [ ] All 10 creation paths produce tasks with correct capability set
- [ ] Migrations applied and verified
- [ ] live_schema.md regenerated
- [ ] STUB_REGISTRY.md updated if needed
