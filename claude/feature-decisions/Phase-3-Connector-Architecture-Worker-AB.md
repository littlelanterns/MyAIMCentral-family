# Feature Decision File: Phase 3 — Connector Architecture (Worker A+B)

> **Created:** 2026-05-02
> **Source material:**
>   - `claude/web-sync/Connector-Build-Plan-2026-04-26.md` — §6.2 items 1-6
>   - `claude/web-sync/Connector-Architecture-and-Routing-Model.md` — Phase 1 design
>   - `claude/web-sync/REWARDS_GROUND_TRUTH_2026-04-25.md` — Existing reward forensic
>   - `claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md` — Existing allowance forensic
>   - `claude/web-sync/Parallel-Builder-Coordination-Brief-2026-04-26.md` — Cross-cutting principles
>   - `.claude/state/phase3-investigation-dispatch.md` — 16 investigation prompts
>   - `prds/addenda/PRD-24-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-28-Cross-PRD-Impact-Addendum.md`
> **Founder approved:** pending

---

## What Is Being Built

The connector layer infrastructure that replaces hardcoded reward/gamification wiring with a flexible, event-driven contract system. Worker A+B builds the foundational schema (contracts, godmother configs, dispatch engine) and extracts shared utilities. This enables mom to mix-and-match rewards freely — "chore completions earn points + creature roll," "piano practice earns just a coloring zone," "potty trips earn treasure box every 5th trip." The visual/rendering layer (sticker book, creatures, coloring) stays untouched; only the trigger/earning layer is decomposed.

---

## Screens & Components

No new UI surfaces in Worker A+B. This is schema + infrastructure only.

| Screen / Component | Notes |
|---|---|
| (none) | Worker A+B is backend-only. UI comes in Worker E (sub-task 17). |

---

## Key Decisions (Easy to Miss)

1. **10 locked source_type strings (verb-form):** `task_completion`, `routine_step_completion`, `list_item_completion`, `intention_iteration`, `widget_data_point`, `tracker_widget_event`, `time_session_ended`, `scheduled_occurrence_active`, `opportunity_claimed`, `randomizer_drawn`
2. **9 v1 godmother types:** `allowance_godmother`, `numerator_godmother`, `money_godmother`, `points_godmother`, `prize_godmother`, `victory_godmother`, `family_victory_godmother`, `custom_reward_godmother`, `assign_task_godmother`
3. **`fixed` calculation_approach is dead** — mathematically identical to `dynamic`. Collapse in migration.
4. **`reward_reveal_attachments.source_type` stays entity-form** (task, widget, list, intention) — different concept from deed-firing verb-form. No migration needed.
5. **Coloring reveals go polymorphic** — `earning_task_id` FK → `(earning_source_type, earning_source_id)`. Zero rows in production = zero risk.
6. **Feature flag:** `families.allowance_dispatch_via` column (`'legacy'`/`'connector'`) for instant rollback.
7. **Inheritance resolution:** deed_override > kid_override > family_default, per godmother_type. `override_mode` handles replace/add/remove.
8. **Idempotency:** `contract_grant_log(deed_firing_id, contract_id)` UNIQUE prevents double-grants.
9. **Graceful no-op:** Unimplemented godmothers log and return `{status: 'no_op'}` — no crash.
10. **`rollGamificationForCompletion` is copy-pasted identically in 3 files** — extract to shared utility first.

---

## Database Changes Required

### New Tables
- `contracts` — central switchboard (identity, lifecycle, deed addressing, IF logic, godmother routing, payload, stroke_of timing, inheritance, presentation)
- `allowance_godmother_configs` — pool assignment, calculation overrides
- `points_godmother_configs` — base points, streak bonuses, creature roll config
- `prize_godmother_configs` — prize type, pool reference, IOU text, expiry
- `assign_task_godmother_configs` — template_id, assignment mode, due date logic
- `custom_reward_godmother_configs` — delivery mode, list_id
- `deferred_grants` — queue for non-immediate stroke_of values
- `contract_grant_log` — append-only audit trail of all grants
- `allowance_dispatch_audit` — dual-logging for migration verification

### Modified Tables
- `deed_firings` — ADD CHECK constraint on source_type (10 verb-form values), add indexes
- `member_coloring_reveals` — DROP `earning_task_id` FK, ADD `earning_source_type TEXT`, ADD `earning_source_id UUID`
- `allowance_configs` — UPDATE `fixed` → `dynamic`, ALTER CHECK to `('dynamic', 'points_weighted')`
- `families` — ADD `allowance_dispatch_via TEXT CHECK ('legacy', 'connector') DEFAULT 'legacy'`

### New RPCs
- `compute_streak(p_family_member_id, p_source_type, p_source_id)` — streak computation from deed_firings
- `dispatch_godmothers(p_deed_firing_id)` — contract evaluation + godmother invocation

### New Edge Functions
- `evaluate-deferred-contracts` — cron-invoked for end_of_day, end_of_week, lifecycle sweep

### New Cron Jobs
- `:25` weekly — `contract-week-end-sweep` (end_of_week contracts)
- `:30` hourly — `contract-lifecycle-sweep` (end_of_day contracts + recently_deleted → archived)
- Extend `:20` `fire-painted-schedules` — also check `at_specific_time` contracts

### Migrations (100199–100206)
- 100199: contracts table + RLS
- 100200: deed_firings CHECK constraint + indexes
- 100201: coloring reveal polymorphic extension
- 100202: allowance_configs fixed→dynamic collapse + families.allowance_dispatch_via
- 100203: godmother config tables
- 100204: compute_streak RPC
- 100205: deferred_grants + contract_grant_log + allowance_dispatch_audit + cron schedules
- 100206: dispatch_godmothers RPC

---

## Feature Keys

No new feature keys for Worker A+B (infrastructure only).

---

## Stubs — Do NOT Build This Phase

- [ ] Godmother implementation logic (Workers C and D, sub-tasks 7-15)
- [ ] Presentation layer wiring (Worker E, sub-task 16)
- [ ] Mom-functional contract authoring UI (Worker E, sub-task 17)
- [ ] Migration from task_rewards → contracts (Worker F, sub-task 18)
- [ ] Legacy code cleanup (Worker F, sub-tasks 19-20)
- [ ] Visual verification scenarios (Worker F, sub-task 21)
- [ ] Do NOT modify `task_rewards`, `calculate_allowance_progress`, or `awardOpportunityEarning`
- [ ] Do NOT modify the 4 gamification hook sites beyond extracting the shared utility

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Contracts | ← | deed_firings | source_type + source_id matching |
| Contracts | → | godmother config tables | godmother_config_id FK |
| dispatch_godmothers | ← | deed_firings | p_deed_firing_id input |
| dispatch_godmothers | → | contract_grant_log | audit trail writes |
| compute_streak | ← | deed_firings | consecutive day counting |
| evaluate-deferred-contracts | ← | contracts (stroke_of != immediate) | cron evaluation |
| evaluate-deferred-contracts | → | deferred_grants → godmother dispatch | grant execution |
| coloring reveals | ← | any deed (via polymorphic source) | earning_source_type + earning_source_id |

---

## Things That Connect Back to This Feature Later

- Workers C+D: Implement 9 godmothers that consume the dispatch infrastructure
- Worker E: Contract authoring UI for mom
- Worker F: Migration from legacy task_rewards + hook sites → deed firings + contracts
- Phase 3.5: Multi-pool allowance (pool_name on godmother configs, per-pool accumulators)
- Phase 3.7: Wizard templates for common patterns (potty chart, chore chart)

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Gamification Impact Plan approved
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> To be completed after build.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
