---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-21
Addendum: prds/addenda/PRD-29-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-29 (source) ↔ PRD-05 (guided modes), PRD-06 (best_intentions.source enum), PRD-08 (journal_entries.related_plan_id stub socket), PRD-09A (tasks.related_plan_id + source='project_planner' + 'goal_decomposition' stub sockets), PRD-11 (victories.source enum 'plan_completed' + 'milestone_completed'), PRD-12A (LifeLantern → BigPlans goal_decomposition), PRD-14 (Personal Dashboard widget — addendum gap), PRD-17 (studio_queue.destination='plan'), PRD-18 (periodic rhythm card — bigplans_checkin_{plan_id}), Platform Intelligence (Channel 13 System Design Patterns)
Provenance: Worker `af3cd498b77d5685a` (Opus, report-only mode) ran the full evidence pass in-memory across the addendum (203 lines) + PRD-29 body + PRD-05 guided-mode seeds (migration `00000000000007:263-267` + `00000000000013:143-144`) + `studio_queue` table DDL (`00000000000008:442-479`) + all `source` CHECK constraints + `victories.source` CHECK + Feature Key Registry seeds + `RoutingStrip.tsx:71-121` full destination catalog + live schema (searched for `plans`, `plan_milestones`, `plan_components`, `plan_check_ins`, `friction_diagnosis_templates` → zero matches). Cross-referenced Scope 2 `SCOPE-2.F67` (AUDIT_REPORT_v1.md:1064-1069) which already closes "PRD-29 unbuilt." Worker returned structured findings as completion text per Option B protocol; orchestrator persisted verbatim.
---

## Worker cover paragraph

Walked PRD-29 BigPlans Cross-PRD Impact Addendum (203 lines) end-to-end against code reality. **Dominant shape:** This is a structural unbuilt-PRD evidence pass — same pattern as PRD-27. PRD-29's own tables/frontend/Edge Functions are absent, so the addendum reads as aspirational. BUT the addendum-declared pre-wired "stub sockets" on other PRDs' tables (PRD-08 `journal_entries.related_plan_id`, PRD-09A `tasks.related_plan_id` + `source='project_planner'`, PRD-09A `source='goal_decomposition'`, PRD-11 `victories.source IN ('plan_completed','milestone_completed')`) ARE present in migrations. Five BigPlans guided modes ARE seeded in `lila_guided_modes` (five modes, not four — drift from the addendum which specifies four). Two drift findings stand out beyond the structural Deferred-to-Gate-4 emission: (1) **Addendum-vs-seeded-migration guided-mode name drift** (addendum says `bigplans`/`bigplans_goal`/`bigplans_project`/`bigplans_system`, migration seeds `bigplans_planning`/`bigplans_friction_finder`/`bigplans_checkin`/`bigplans_system_design_trial`/`bigplans_deployed_component`). (2) **Five BigPlans feature keys referenced from `lila_guided_modes.requires_feature_key` but ZERO of them inserted into `feature_key_registry`** — a foreign-key-intent violation identical in shape to other unbuilt-feature registry gaps.

## Per-seam two-column table

| # | Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|---|
| 1 | **5 BigPlans tables created** | Addendum L188-192 | `claude/live_schema.md` — all 5 absent. Zero migrations mention them. | Deferred-Document (PRD-29 unbuilt per SCOPE-2.F67) | **SCOPE-3** | N |
| 2 | **4 guided modes registered: `bigplans`, `bigplans_goal`, `bigplans_project`, `bigplans_system`** | Addendum L20-25 + L194-199 | Migration `00000000000007:263-267` seeds **5 different modes**: `bigplans_planning`, `bigplans_friction_finder`, `bigplans_checkin`, `bigplans_system_design_trial`, `bigplans_deployed_component`. Parent mode `bigplans` referenced in `00000000000013:143` as UPDATE target but never INSERTED. | Unintentional-Fix-PRD (addendum + code drift — addendum predates the finalized 5-mode taxonomy) | **SCOPE-3** | N |
| 3 | **5 BigPlans feature keys registered** | Feature Glossary + addendum L21-25 `requires_feature_key` column values | Migration `00000000000007:281-290` Feature Key Registry seed contains **zero** bigplans_ keys. `lila_guided_modes.requires_feature_key` references all 5 but NO matching `feature_key_registry` row exists. `useCanAccess('bigplans_create')` would resolve against an absent registry entry. | Unintentional-Fix-Code (registry-reference-without-registration) | **SCOPE-3** | N |
| 4 | **`studio_queue.destination` CHECK adds `'plan'`** | Addendum L134-135 | Migration `00000000000008:442-461` declares `studio_queue.destination TEXT` with **NO CHECK constraint**. `'plan'` is additive/unenforced — no migration required. Zero code paths write `destination='plan'`. | Intentional-Document + Deferred-Document (writer absent) | **SCOPE-3** (informational) | N |
| 5 | **RoutingStrip adds BigPlans destination** | Addendum L82-87 | `RoutingStrip.tsx:71-121` catalogs 20 destinations. **No BigPlans/plan/bigplans destination exists.** | Deferred-Document (PRD-29 unbuilt) | **SCOPE-3** | N |
| 6 | **`journal_entries.related_plan_id UUID FK → plans`** | Addendum L72-78 | Migration `00000000000006:19` declares `related_plan_id UUID,` (NO FK because `plans` doesn't exist). Column present, typed in `useJournal.ts:19`. Stub socket wired; FK constraint deferred. | Intentional-Document (stub socket wired per pre-dependency) | — (no finding) | — |
| 7 | **`tasks.related_plan_id` + `source='project_planner'` pre-wired stubs marked WIRED** | Addendum L94-98 | Migration `00000000000008:108,119` declares column + index. Migration `00000000000028:11` + 7 other migrations include `'project_planner'` and `'goal_decomposition'` in `tasks.source` CHECK. `src/types/tasks.ts:285` types it. **BUT: no code path writes `source='project_planner'` today** — WIRED status is stub-socket only; the writer (BigPlans) is absent. Addendum's "WIRED" claim is aspirational. | Unintentional-Fix-PRD (addendum status claim drift — "stub-socket-present" ≠ "WIRED") | **SCOPE-3** | N |
| 8 | **`'goal_decomposition'` studio_queue source WIRED (LifeLantern → BigPlans)** | Addendum L114, L130-131 | Same as seam 7: enum-value-present, no writer. PRD-12A LifeLantern itself is also unbuilt. | Deferred-Document (both sides absent) | **SCOPE-3** | N |
| 9 | **Best Intentions `source='bigplans'` CHECK value added** | Addendum L60-61 | Grep `'bigplans'` in `best_intentions.source` CHECK: migrations do NOT include `'bigplans'`. Verified absence. | Deferred-Document (CHECK amendment can land with BigPlans build) | **SCOPE-3** | N |
| 10 | **Victory sources `'plan_completed'` + `'milestone_completed'` added** | Addendum L160-166 | Migration `00000000000009:319` + `00000000100102:42` BOTH include both values in `victories.source` CHECK. Typed and labeled. Stub sockets present, writer absent. | Intentional-Document (schema-ready) | — (no finding) | — |
| 11 | **BigPlans check-in rhythm card registered as periodic rhythm source** | Addendum L139-153 | Grep `bigplans_checkin\|bigplans.*rhythm` in `src/` → zero matches. Rhythms Phase B/C/D migrations do NOT include a BigPlans periodic card source. | Deferred-Document (PRD-29 unbuilt) | **SCOPE-3** | N |
| 12 | **Context assembly loads Active Plans block for every LiLa conversation** | Addendum L42-51 | `src/lib/ai/context-assembly.ts` — grep `bigplans\|plans\|plan_milestones` returns zero functional matches. No `from('plans')` query in shared context assembler nor any Edge Function. | Deferred-Document (PRD-29 unbuilt) | **SCOPE-3** | N |
| 13 | **Intent pattern `friction_detection` with cross-conversation vector matching + 7-day suppression** | Addendum L27-40 | Grep `friction_detection\|friction_finder` in `src/`: zero functional matches. LiLa intelligence layer has no friction-detection pattern file. | Deferred-Document (PRD-29 unbuilt) | **SCOPE-3** | N |
| 14 | **Platform Intelligence capture channel "System Design Patterns" added** | Addendum L169-178 | `platform_intelligence.*` schema in live_schema contains 3 tables (`book_chunks`, `book_extractions`, `book_library`) — none relating to system-design patterns. | Deferred-Document (PRD-29 unbuilt + pipeline registry infrastructure also deferred) | **SCOPE-3** | N |
| 15 | **BigPlans Enhanced+ tier gating via `bigplans_create` etc. feature keys** | Feature Glossary PRD-29 row | `feature_access_v2` seeds: zero `bigplans_*` rows. `<PermissionGate featureKey="bigplans_create">` wraps `BigPlansPage` in `src/pages/placeholder/index.tsx:59` but the gated surface is a PlaceholderPage. No tier check actually gates any BigPlans logic. | Deferred-Document (PRD-29 unbuilt; gating infrastructure also pending feature_key_registry seeds per seam #3) | **SCOPE-3** | N |

## Unexpected findings list (seams not covered by addendum)

1. **Guided-mode name drift is a fresh finding shape.** Addendum names 4 modes; code seeds 5 modes. Not the same mode taxonomy. The addendum predates the 5-mode seed; this is reverse of the usual drift direction (usually PRD is ahead of code; here code is ahead of PRD). Context-assembly helper already hardcodes `'bigplans_planning'` — which is the seeded name, not the addendum name. Code is self-consistent; the addendum is the stale artifact.

2. **5 dangling feature keys** on an unbuilt surface. `bigplans_ai_compile` additionally has zero references anywhere in the codebase — named in Feature Glossary and `tests/permission-engine.test.ts` but never seeded or checked.

3. **Stub-socket-as-WIRED addendum status drift.** Addendum L94-98 claims `tasks.source='project_planner'` + `tasks.related_plan_id` stubs are "WIRED" because the column+enum-value exist. WIRING_STATUS.md convention (L3 "If it doesn't work in the app, it is not wired") explicitly contradicts this.

4. **BigPlans Personal Dashboard widget (implied by PRD-14 integration) is NOT called out in the addendum.** The addendum's Section list is exhaustive for the listed PRDs but omits PRD-14 Personal Dashboard widget integration.

5. **5 BigPlans LiLa guided modes are all marked `sonnet` tier** (migration `00000000000007:263-267`). No Haiku-tier offloading for cheap operations. Scope 4 cost-pattern candidate, not Scope 3+8b.

## Proposed consolidation (§5.1 + §5.2 candidates)

**§5.1 within-addendum:** Seams 1, 5, 9, 11, 12, 13, 14, 15 all collapse to one Deferred-Document finding. Seams 4 and 10 have schema-ready stub sockets confirmed (no finding). Seams 2, 3, 7 stand alone as active drift findings.

**§5.2 cross-addendum:**
- **F11 server-side enforcement — no fresh BigPlans contribution today.** Because PRD-29 has zero Edge Functions and zero RPCs, there are no server-gate surfaces to audit. When the BigPlans build lands, `bigplans-compile` Edge Function + `friction_detection` intent router will become F11 candidates. Flag for future.
- **Feature-key-registry-reference-without-registration pattern.** Seam #3 here matches prior evidence file patterns. If this pattern appears on PRD-30/PRD-32/PRD-27 as well (likely), a cross-addendum §5.2 consolidation could collapse them to one systemic finding. **Recommend orchestrator test for this across the already-closed evidence files.**
- **Stub-socket-vs-WIRED addendum terminology drift.** Seam #7 is a candidate for cross-addendum consolidation if PRD-12A / PRD-17 / PRD-32A addenda also claim "WIRED" for stubs-without-writers. Worth a sweep.

## Proposed finding split

1. **F-A: PRD-29 BigPlans integration surface deferred — addendum entirely unbuilt (stubs only).** Deferred-Document. Cross-reference SCOPE-2.F67. **SCOPE-3 Low. Beta N.** (Consolidates seams 1, 5, 9, 11, 12, 13, 14, 15.)

2. **F-B: BigPlans guided-mode taxonomy drift — addendum specifies 4 modes, code seeds 5 different modes.** Unintentional-Fix-PRD. **SCOPE-3 Low. Beta N.** (Seam 2 alone.)

3. **F-C: 5 BigPlans feature keys referenced from `lila_guided_modes.requires_feature_key` but absent from `feature_key_registry` seed.** Unintentional-Fix-Code. **SCOPE-3 Medium. Beta N.** (Seam 3 alone; candidate for §5.2 if pattern repeats.)

4. **F-D: Addendum marks BigPlans stub sockets "WIRED" despite no writer existing — WIRING_STATUS convention violated.** Unintentional-Fix-PRD. **SCOPE-3 Low. Beta N.** (Seam 7 alone — also seam 8.)

**No SCOPE-8b emissions.** BigPlans has zero child-data surfaces today (unbuilt). All safety concerns defer to the PRD-29 build itself.

## Beta Y candidates

None. All findings are Beta N.

## Top 3 surprises

1. **Code is ahead of PRD on guided-mode taxonomy.** Migrations seed 5 BigPlans guided modes reflecting a more mature design than the 4-mode addendum.

2. **Stub sockets on 4 different tables were diligently pre-wired across 8+ migrations** for a PRD that never landed. Operationally rigorous but technically debt — each unused enum value is a small correctness surface to maintain.

3. **`bigplans_ai_compile` feature key exists only in `feature_glossary.md`, `CORRECTED_FEATURE_KEY_REGISTRY.md`, and `tests/permission-engine.test.ts` — never in a migration, never in a `<PermissionGate>` usage, never in the addendum.** Completely orphaned feature key.

## Watch-flag hits

1. **F11 server-side enforcement:** No contribution today. Will become relevant when BigPlans `compile` Edge Function + `friction_detection` cross-conversation intent router land.
2. **Crisis Override:** No contribution today. When built, Friction Finder / Check-In / Planning modes must all pass through global crisis keyword check per CLAUDE.md #7. Flag as prerequisite for PRD-29 build.
3. **F17 messaging:** No contribution.
4. **F22+F23:** No contribution.
5. **studio_queue source discipline:** Drift-adjacent — `'project_planner'` + `'goal_decomposition'` are enum-present but never written. Documentation watch-flag.
6. **`is_included_in_ai` + three-tier toggle:** No BigPlans-side contribution. When built, context-assembly addition MUST respect `is_included_in_ai` on the plans table per Convention #74 propagation pattern.

**Additional observations for orchestrator:**
- PRD-29 should likely be ADDED to `scope-3-8b-evidence/DECISIONS.md` Round 0 Deferred-to-Gate-4 table (same shape as PRD-27 addition recommended).
- Cross-reference to add in any emitted finding: SCOPE-2.F67.

## Orchestrator adjudication

(empty — pending walk-through)
