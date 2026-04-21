---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-21
Addendum: prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md
Bridged PRDs: PRD-09A (Tasks/Routines) ↔ PRD-09B (Lists/Studio), with forward-notes to PRD-24 (Gamification), PRD-28B (Compliance), PRD-11 (Victories), PRD-29 (BigPlans)
Provenance: Worker `ac3c45536be17f846` (Opus, report-only mode) ran full evidence pass across addendum + 6 enhancement sections (A–F) + migration 100105 + `src/hooks/usePractice.ts` + `useRandomizerDraws.ts` + `useSequentialCollections.ts` + `CurriculumParseModal.tsx` + `curriculum-parse/index.ts` Edge Function + `Tasks.tsx` (PendingApprovalsSection fork) + `Lists.tsx` (RandomizerMasteryApprovalInline) + `RoutineStepChecklist.tsx` + `RoutineDuplicateDialog.tsx` + `studio-seed-data.ts` (Reading List ex_reading_list template). Worker returned structured findings as completion text per Option B protocol; orchestrator persisted verbatim.
---

## Worker cover paragraph

This evidence pass examines the **PRD-09A/09B Linked Steps, Mastery & Practice Advancement Addendum** (Build J, signed off 2026-04-06). Every seam described in the addendum's 6 enhancement sections (A–F) was traced from addendum spec → migration 100105 → hook/component code. **The integration landed remarkably complete**: all 41 column additions shipped in a single atomic migration, `practice_log` + `randomizer_draws` tables exist with correct RLS, both the dedicated `curriculum-parse` Edge Function and `CurriculumParseModal` with HITM review step ship, and the dual-write pattern for sequential items (practice_log + task_completions) works as specified. Surprise Me determinism is enforced via the UNIQUE partial index per Convention #163. `PendingApprovalsSection` fork on `completion_type='mastery_submit'` is wired per Convention #161. `RoutineDuplicateDialog` handles linked-step resolution per Decision #14. `SequentialCreatorModal` is the single entry point per Convention #150-152. Because this build is post-signoff, the finding cardinality focuses on integration drift since 2026-04-06 — the randomizer mastery gamification gap (already acknowledged in Convention #205 + CLAUDE.md #161), and smaller pattern-level items. **Build J is the cleanest post-signoff surface audited so far in Scope 3+8b.**

## Per-seam two-column table

| Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|------|---------------|--------------|----------------|--------------------|--------------|
| Linked step schema (`task_template_steps` 4 cols) | §Schema Changes for Linked Steps | Migration 100105 §4 lines 72–79 adds all 4 columns with CHECK constraint on enums + partial index | Intentional-Document | None (compliant) | — |
| Sequential advancement schema (`tasks` +10, `sequential_collections` +5, `task_completions` +4) | §Schema Changes for Sequential Items | Migration 100105 §1–3 (lines 23–67) adds exactly these columns with enum CHECKs | Intentional-Document | None | — |
| Randomizer advancement (`list_items` +10, `lists` +7) | §Schema Changes for Randomizer Advancement | Migration 100105 §5–6 (lines 89–121) — identical shape | Intentional-Document | None | — |
| `practice_log` unified cross-source log | §New table: `practice_log` | Migration 100105 §7 (L127–181) + `useLogPractice` dual-write at `src/hooks/usePractice.ts:80-245` — writes practice_log AND task_completions for sequential items per Convention #159 | Intentional-Document | None | — |
| `randomizer_draws` with Surprise Me UNIQUE index | §Tables + Convention #163 determinism | Migration 100105 §8 (L187–213) with UNIQUE partial index `idx_randomizer_draws_surprise_daily` on `(list_id, family_member_id, routine_instance_date) WHERE draw_source='auto_surprise'` — exact Convention #163 match. `useSurpriseMeAutoDraw` with unique-violation fallback | Intentional-Document | None | — |
| Mastery approval routes through existing `PendingApprovalsSection` (Conv #161) | §Advancement Flow | `Tasks.tsx:1585` `PendingApprovalsSection` forks on `completion_type='mastery_submit'`. Uses `useApproveMasterySubmission` / `useRejectMasterySubmission`. Randomizer mastery forks to per-list `RandomizerMasteryApprovalInline` at `Lists.tsx:2914` | Intentional-Document | None | — |
| Mastery rejection resets to 'practicing' (Conv #160) | §Advancement Flow | `useRejectMasterySubmission` at `usePractice.ts:583-673` sets `mastery_status: 'practicing'` (not `'rejected'`), matching Convention #160 | Intentional-Document | None | — |
| `curriculum-parse` dedicated Edge Function (Conv #165) | §Enhancement E | `supabase/functions/curriculum-parse/index.ts:1-233` — Haiku via OpenRouter, Zod schemas, `logAICost` call, markdown-fence fallback. Exact task-breaker parallel | Intentional-Document | None | — |
| HITM gate on `curriculum-parse` (CLAUDE.md #4) | §Enhancement E.6 | `CurriculumParseModal.tsx:80` two-step state `'input' \| 'review'`; `handleAccept` only fires on explicit mom click. Each parsed item can be edited/removed before accept | Intentional-Document | None | — |
| `tasks.resource_url` dedicated column (Conv #166) + image_url backfill | §Enhancement E URL Detection | Migration 100105 §1 L36 adds column + §11 L316–321 idempotent backfill. `useSequentialCollections.ts:164` comment confirms. `resource_url` rendered in TaskCard + RoutineStepChecklist | Intentional-Document | None | — |
| Linked-step dashboard rendering | §Enhancement A + Convention #157 "resolved at render time" | `RoutineStepChecklist.tsx:175` `isLinked = step.step_type !== 'static'`; L214–221 renders `<LinkedSequentialContent>`, `<LinkedRandomizerContent>`, `<LinkedTaskContent>` | Intentional-Document | None | — |
| Routine duplication with linked-step resolution (Decision #14) | §Enhancement F | `RoutineDuplicateDialog.tsx` (380 lines) with `LinkedStepResolution` type, `LinkedSourcePicker` integration, per-step resolution prompt | Intentional-Document | None | — |
| Reading List Studio template (Conv #164) | §Enhancement D | `studio-seed-data.ts` defines `ex_reading_list` template; `Studio.tsx:200, 419, 864-880` opens `SequentialCreatorModal` with `initialDefaults: {defaultAdvancementMode: 'mastery', defaultRequireApproval: true, defaultTrackDuration: true}` per Convention #164 | Intentional-Document | None | — |
| **Randomizer mastery gamification gap (Conv #205 / CLAUDE.md #161)** | §Enhancement C — addendum describes mastery exit-from-pool but does NOT specify gamification award. Forward Note PRD-24 says practice+mastery should award points. CLAUDE.md #205 acknowledges randomizer mastery does NOT fire `roll_creature_for_completion` pipeline | `usePractice.ts:532–562` sequential branch fires `rollGamificationForCompletion(completionId)`; randomizer branch has explicit comment "Randomizer items do NOT go through task_completions, so the gamification pipeline is not fired here ... known gap for Sub-phase C" | **Deferred-Document** (gap ALREADY documented in Convention #205) | SCOPE-3 cross-reference only | N |
| BigPlans badge/award "pick N of M" deferral (Conv #167) | §Enhancement E + §Cross-PRD "PRD-29 (Forward Note)" + Decision #10 | `curriculum-parse/index.ts:101-105` returns `pick_n_of_m` in `detected_metadata`; `CurriculumParseModal.tsx:307` displays "Note: detected a 'pick N of M' pattern" — purely informational | Intentional-Document (deferred per Conv #167) | None | — |
| `practice_log` RLS | §RLS Policy | Migration 100105 L155–181 enables RLS with correct policies | Intentional-Document | None (no safety component) | — |
| Advancement mode propagation to `counts_for_*` flags | §Cross-PRD "PRD-28B Forward Note" | `useSequentialCollections.ts:140-173` relies on schema defaults (`counts_for_gamification=true`, others `false`). `useLogPractice` writes `completion_type='practice'` which the RPC skips (Convention #200) | Intentional-Document | None | — |

## Unexpected findings list

1. **Addendum internal ambiguity at L182** — "Mom rejects → `mastery_status = 'rejected'`, `mastery_status` reset to 'practicing'" reads as self-contradicting. Convention #160 resolves ("resets to 'practicing', NOT 'rejected'"). Code matches Convention #160. Cleanup opportunity for addendum text; no finding.

2. **`randomizer_draws.status` CHECK accepts `'submitted'`** (migration L197) but addendum's status enum at L275 is only 4 values. 5th needed for "mastery pending approval" for randomizer items. Fix-forward drift during build — expected.

3. **`practice_log.rejected` / `rejection_note` columns** — migration L141–142 adds both; addendum does NOT list them. Used to preserve rejection audit per Convention #160. Implementation refinement beyond spec.

4. **`task_completions.completion_type='mastery_approved'`** added by Build M Sub-phase C is outside Build J's own enum definition. `usePractice.ts:468` updates `completion_type: 'mastery_approved'` at approval time. The CHECK constraint in migration 100105 would have rejected this value — a later migration must have widened the constraint. **Worth verifying** via live_schema or grep.

## Proposed consolidation (§5.1 + §5.2 candidates)

- **§5.1 within-addendum:** The 14 seams collapse cleanly to 1-2 findings at most. The entire surface is a clean "Intentional-Document" row — Build J shipped as designed.
- **§5.2 cross-addendum:** The **randomizer mastery gamification gap** sits at the junction of Build J + Build M. Already consolidated by CLAUDE.md #205. This Scope 3+8b pass should **cross-reference but NOT re-emit**.

## Proposed finding split

- **0 new SCOPE-3 findings** for this surface. Build J integration landed as spec'd.
- **0 new SCOPE-8b findings.** No safety/compliance component.
- **1 cross-reference only:** Randomizer mastery gamification gap → consolidate with the existing Conv #205 documentation.

## Beta Y candidates

None. Build J is production-ready per its own scope.

## Top 3 surprises

1. **Build J landed cleaner than most audits find.** 14 seams traced, 0 drift items meaningful enough to emit as SCOPE-3 findings. The 41-column atomic migration + idempotent backfill + unique partial index all match spec exactly. This is how post-audit evidence should look when a build signed off only 14 days before the audit.

2. **Finding #4 in Unexpected findings (`'mastery_approved'` value added to `completion_type` enum post-hoc)** is a real CHECK-constraint drift signal worth verifying.

3. **The addendum's text at L182 contradicts itself about rejection status**, resolved only by reading Convention #160. Cleanup opportunity.

## Watch-flag hits

- **F11 server-side enforcement:** Not relevant — `practice_log` / `randomizer_draws` enforce via RLS policies. Clean.
- **Crisis Override:** Not relevant — `curriculum-parse` is single-turn structured extraction, parallel to `task-breaker`.
- **F17 messaging:** Not relevant.
- **F22+F23:** Not relevant.
- **studio_queue source discipline:** Not relevant — `source='template_deployed'` is set correctly.
- **is_included_in_ai:** Not relevant.

## Orchestrator adjudication

(empty — pending walk-through)
