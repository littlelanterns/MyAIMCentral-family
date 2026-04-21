---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-20
Addendum: prds/addenda/PRD-28-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-28 (source) ↔ PRD-09A (Tasks — three flag columns), PRD-24/24A/24B (Gamification — `counts_for_gamification` + `roll_creature_for_completion` RPC), PRD-26 (Play Dashboard), PRD-15 (`family_requests.source` widening), PRD-28B (Compliance — Deferred-to-Gate-4)
Provenance: Worker `abd75341cd88f476a` (Opus, report-only mode) ran the full evidence pass in-memory across the addendum, founder feature decision file, Sub-phase A migration `00000000100134_allowance_financial.sql`, Sub-phase B migration `00000000100136_homeschool_tracking.sql`, family_requests enum-widen migration `00000000100137`, both Edge Functions (`calculate-allowance-period`, `accrue-loan-interest`), the React layer (`useTasks.ts`, `useTaskCompletions.ts`, `useFinancial.ts`, `useHomeschool.ts`, `LogLearningTracker.tsx`, `LogLearningModal.tsx`, `Tasks.tsx`, `createTaskFromData.ts`), the LiLa context-assembler (`supabase/functions/_shared/context-assembler.ts`), and the messaging RequestSource type. Worker returned structured findings as completion text per Option B protocol; orchestrator persisted verbatim.
---

## Worker cover paragraph

Worker traversed the PRD-28 Cross-PRD Impact Addendum surface. Read the addendum in full, plus the founder feature decision file (`claude/feature-decisions/PRD-28-Tracking-Allowance-Financial.md`), then walked the Sub-phase A migration (`00000000100134_allowance_financial.sql`) at full length, the Sub-phase B migration (`00000000100136_homeschool_tracking.sql`), the family_requests enum-widen migration (`00000000100137`), both Edge Functions (`calculate-allowance-period`, `accrue-loan-interest`), the React layer (`useTasks.ts`, `useTaskCompletions.ts`, `useFinancial.ts`, `useHomeschool.ts`, `LogLearningTracker.tsx`, `LogLearningModal.tsx`, `Tasks.tsx`, `createTaskFromData.ts`), the LiLa context-assembler (`supabase/functions/_shared/context-assembler.ts`), and the messaging RequestSource type. PRD-28 is one of the better-wired surfaces in the audit so far — the financial-data-exclusion guardrail is documented and verified, the gamification-flag check actually exists in the RPC, append-only RLS is enforced via missing UPDATE/DELETE policies, and the dual-record `homeschool_configs` resolver helper exists in code. The drift surfaces are at the seams the addendum did not anticipate: the approval-time path doesn't write `homeschool_time_logs`, the first `allowance_periods` row has no creator (cron only closes existing rows then opens the next), the addendum-promised `'hourly'` business work pathway has zero UI/Edge Function consumers despite the CHECK constraint adding it, and `'financial_approval'` is a type-union member never actually instantiated. Surfaces touching PRD-28B (Compliance & Progress Reporting) are Deferred-to-Gate-4. Surfaces touching widget infrastructure for the Allowance Calculator are wired through `useFinancial` correctly.

## Per-seam two-column table

| Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|
| 1. Three task-completion downstream systems (PRD-24 gamification + PRD-28 financial + PRD-28 homework time logs) | Addendum L23: "Task completion now triggers **three independent downstream systems**" | `useCompleteTask` (`src/hooks/useTasks.ts:302-335`) fires gamification RPC AND inserts `homeschool_time_logs` rows, BUT only when `!requireApproval`. Approval path `useApproveCompletion` (`src/hooks/useTaskCompletions.ts:154-208`) fires gamification but does NOT create homework time logs. Allowance is captured implicitly via cron reading `tasks.status='completed'` per period. | Unintentional-Fix-Code | **SCOPE-3** | N (post-MVP polish; doesn't expose data, just under-counts homework hours for approval-required tasks) |
| 2. `counts_for_gamification` flag respected by `roll_creature_for_completion` RPC | Founder Addition 1 (decision file L75-83) + CLAUDE.md #224: RPC must skip gamification when flag = false | Migration 100134:455-460 — Step 2.5 in RPC: `IF COALESCE(v_task.counts_for_gamification, true) = false THEN RETURN jsonb_build_object('skipped_gamification_opt_out', true)` | Documented (no finding) | — | — |
| 3. `counts_for_allowance` flag drives `allowance_periods` calculation | Founder Addition 1: per-task flag replaces category buckets; allowance % = completed/assigned where flag=true | `calculate-allowance-period/index.ts:148-156` filters `eq('counts_for_allowance', true).eq('assignee_id', period.family_member_id)` — wired correctly | Documented (no finding) | — | — |
| 4. `counts_for_homework` flag triggers homework time log creation | Founder Addition 1: opt-in homework hour logging | `useTasks.ts:310-335` writes `homeschool_time_logs` row on immediate task completion. **Approval-path gap noted in seam #1.** | Documented (with cross-ref to seam #1) | — | — |
| 5. **Financial data EXCLUSION from LiLa context (Convention #225, SCOPE-8b axis)** | Convention #225: `_shared/context-assembler.ts` MUST NEVER load `financial_transactions`, `allowance_configs`, `allowance_periods`, `loans` | `context-assembler.ts:11-18` carries explicit comment block "PRD-28 EXCLUSION: Financial data is NEVER loaded into LiLa context." Grep across `supabase/functions/**` for `financial_transactions\|allowance_configs\|allowance_periods\|loans` returns hits only in the two PRD-28-owned Edge Functions (`calculate-allowance-period`, `accrue-loan-interest`) — zero stray loads from any LiLa surface, ThoughtSift Edge Function, or context-assembler dependency. | **PASS — documented (no finding)** | — | — |
| 6. `financial_transactions` append-only via INSERT-only RLS | Convention #223 + decision file L243 | Migration 100134:143-164 — RLS enabled, `ft_family_read` (SELECT) + `ft_parent_insert` (INSERT) policies present, NO UPDATE or DELETE policies created. Comment at L164: "No UPDATE or DELETE policies — append-only enforced at RLS level." | Documented (no finding) | — | — |
| 7. Dual-record `homeschool_configs` (family-default + per-child override) | Convention #226; founder decision B3 | Migration 100136:84-92 creates two partial unique indexes: `idx_hc_family_default WHERE family_member_id IS NULL` + `idx_hc_child_unique WHERE family_member_id IS NOT NULL`. Resolver helper `useResolvedHomeschoolConfig` (`src/hooks/useHomeschool.ts:154-172`) merges child override → family default → system default per spec. | Documented (no finding) | — | — |
| 8. **First `allowance_periods` row creation** | Founder decision (Open Q1, decision file L106): "First allowance period starts immediately, pro-rated from today" | Grep `from('allowance_periods').insert\|INSERT INTO.*allowance_periods` returns zero hits in `src/`, zero hits in migrations except inside the cron-triggered Edge Function (which only opens the NEXT period after closing one). **There is no code path that creates the FIRST period when allowance is enabled.** Mom configures allowance → no period exists → cron has nothing to close → no transactions ever land. | Unintentional-Fix-Code | **SCOPE-3** | **Y** (allowance system is functionally non-operational at first-use without this; founder decision was explicit) |
| 9. `'hourly'` reward type for business work | Addendum L24: "Business work tasks need support for hourly rate pricing... `task_rewards.reward_type` field needs `'hourly'` added" | Migration 100134:298-304 adds `'hourly'` to CHECK constraint. Grep `hourly\|business work\|reward_type.*hourly` in `src/` returns ZERO files. No UI to set hourly rate, no Edge Function consumes it, no consumer of `time_sessions × rate`. CHECK constraint allows it; nothing else exists. | Unintentional-Fix-Code (or Deferred-Document if intentional) | **SCOPE-3** | N (business work is post-MVP per stub list L429) |
| 10. `'financial_approval'` request source | Addendum L54: "`'financial_approval'` — business work earnings calculated from timer sessions awaiting mom's confirmation" | `RequestSource` type extended in `src/types/messaging.ts:17`. Migration 100137 widens DB CHECK. Grep `financial_approval` returns hits ONLY in the type union and migration. **No code path ever instantiates a `family_requests` row with `source='financial_approval'`.** Same root cause as seam #9 (business work unwired). | Unintentional-Fix-Code | **SCOPE-3** (consolidates with seam #9) | N |
| 11. `'homeschool_child_report'` request source | Addendum L53 + decision file L423 | `LogLearningModal.tsx:147` instantiates `family_requests` row with `source: 'homeschool_child_report'` for Play/Guided submissions awaiting mom approval. Wired correctly. | Documented (no finding) | — | — |
| 12. Allowance approval-time write — when child completes a homework-flagged task that requires approval, time log not created on approval either | Implicit from addendum L23 + founder decision file post-build verification | `useApproveCompletion` (`useTaskCompletions.ts:154-208`) fires `roll_creature_for_completion` (Build M Sub-phase C) but does NOT write `homeschool_time_logs`. The fork is hardcoded in `useTasks.ts:310` — `homeschool_time_logs` is created only on `!requireApproval`. | Unintentional-Fix-Code (consolidated with seam #1) | **SCOPE-3** | N (under-counts hours for approval-required homework; can be back-filled manually) |
| 13. Activity log integration for tracking events | Implicit (CLAUDE.md activity logging convention) | Grep `activity_log_entries.*counts_for\|allowance_earned.*activity` returns zero hits. Allowance-earned transactions, loan accruals, and homework time logs do not write `activity_log_entries`. | Intentional-Document (financial events deliberately segregated per Convention #225 spirit) OR Unintentional-Fix-Code | **SCOPE-3** | N (consistent with financial-exclusion intent — surfacing in activity log would risk leak into LiLa context downstream) |
| 14. Subject Tracking section in TaskCreationModal (per addendum L26) | Addendum L26: "Subject Tracking section spec in Task Creation Modal" | Grep `homework_subject_ids\|Subject Tracking` in `TaskCreationModal.tsx` returns zero. Stubbed in feature decision file L425. `homework_subject_ids` is set/persisted via `createTaskFromData` and `Tasks.tsx`, but the dedicated UI section the addendum names is absent. | Deferred-Document (founder-acknowledged stub) | — | — |
| 15. PRD-28B Compliance & Progress Reporting handoff | Addendum implicit + STUB_REGISTRY | PRD-28B unbuilt — six tables stubbed per decision file L304-305. | Deferred-to-Gate-4 | — | — |
| 16. PRD-09A `task_type='makeup'` (Founder Addition 2) | Decision file L57-67 | Migration 100134 adds `'makeup'` to `tasks.task_type` CHECK. WeeklyProgressCard wires `[+ Assign Makeup Work]` → TaskCreationModal pre-configured. | Documented (no finding) | — | — |
| 17. Privilege Status Widget reads `allowance_periods.completion_percentage` OR raw task % | Founder Addition 3 | `PrivilegeStatusTracker.tsx` exists. Reads `allowance_periods` for configured members + raw task % fallback per decision file L84-87. | Documented (no finding) | — | — |
| 18. Settings sections "Allowance & Finances" + "Homework & Subjects" | Addendum L70-77 | Both wired in `SettingsPage.tsx`, mom-only, conditional visibility for Homework via `useCanAccess('homeschool_subjects')` per decision file L399-419. | Documented (no finding) | — | — |

## Unexpected findings list (seams not covered in addendum)

1. **Approval-path homework time log gap** (seam #1 / #12) — addendum doesn't distinguish immediate-completion vs approval-required completion; the dual-path forks at the wrong layer (`useTasks.ts` immediate write vs `useTaskCompletions.ts` approval write don't share logic).
2. **First allowance period bootstrap is missing entirely** (seam #8) — neither addendum nor PRD names the trigger that creates the first row when mom enables allowance. Founder explicitly answered Open Q1 with "Start immediately, pro-rated from today" — no code implements this.
3. **`'hourly'` and `'financial_approval'` are dead enum members** (seams #9 + #10) — addendum names them as wired contracts; only the schema-level CHECK constraints exist. No producer, no consumer.
4. **Activity log silence on financial events** (seam #13) — surface for orchestrator review: this may be deliberate (don't surface dollar amounts where LiLa might pick them up) OR may be a gap. Cannot determine intent from artifact alone.

## Proposed consolidation

**§5.1 within-addendum consolidation candidates:**
- Seams #1 + #12 share root cause: approval-path missing homework time log writes. Consolidate into one finding.
- Seams #9 + #10 share root cause: business-work hourly pathway unwired (CHECK + type union added; no producer/consumer). Consolidate into one finding.

**§5.2 cross-addendum consolidation candidates flagged for orchestrator:**
- **`family_requests.source` enum widening pattern** — PRD-15 evidence file (seam #9) flagged migration 100137 widening the enum without amending PRD-15 addendum. PRD-28 evidence file confirms migration 100137 is owned by PRD-28 and adds `'homeschool_child_report'` + `'financial_approval'`. This is the same enum-widen pattern; the documentation drift sits in the PRD-15 addendum (which still names only the original 3 source values). Worker recommends elevating to a single cross-addendum SCOPE-3 finding "PRD-28 widens `family_requests.source` enum without back-amending PRD-15 Cross-PRD addendum" once Walk-through reaches PRD-15 round.
- **Approval-time wiring discontinuity** — recurring shape: `useCompleteTask` does X, `useApproveCompletion` doesn't do X. Worker has only one site here (homework time logs) but flags the pattern in case PRD-24 (creature awards) or PRD-11 (victory creation) show similar drift. Currently NOT a 3+ pattern; do not consolidate yet.

## Proposed finding split

- SCOPE-8b primary (with SCOPE-3 cross-refs): **0** (PRD-28 financial exclusion guardrail PASSES — Convention #225 fully honored; no safety drift surfaces)
- SCOPE-3 only: **3** after consolidation (consolidated #1+#12, #8, consolidated #9+#10)
- Documented (no finding): **10** (seams #2, #3, #4, #5, #6, #7, #11, #16, #17, #18)
- Deferred-Document: **1** (seam #14 — Subject Tracking section stubbed)
- Deferred-to-Gate-4: **1** (seam #15 — PRD-28B unbuilt)

After consolidation: **3 SCOPE-3 findings** total for PRD-28. Zero SCOPE-8b primaries. The financial-exclusion guardrail (the headline SCOPE-8b axis for this surface) PASSES on first audit.

## Beta Y candidates

1 only: **Seam #8 (first allowance_periods row never created)**. The allowance system silently no-ops on first use — mom enables allowance, configures the child, expects the system to start tracking. Cron only closes existing periods + opens next. No bootstrap. Without this, allowance is functionally non-operational from the user's first-config moment. Severity: High → Blocking depending on whether founder considers allowance MVP-essential.

Other SCOPE-3 findings (homework approval-path gap, hourly business work unwired) are post-MVP polish per stub list — Beta default N.

## Top 3 surprises

1. **Convention #225 (financial data exclusion from LiLa context) is the single best-wired guardrail in the audit so far.** Documented in code with a comment block at the top of `context-assembler.ts:11-18`, verified by exhaustive grep across `supabase/functions/**` returning zero stray loads. This is the gold standard — explicit comment + zero violations + grep-able for future regression.
2. **`useApproveCompletion` doesn't write `homeschool_time_logs`** even though `useCompleteTask` does. The pattern divergence at the approval seam silently under-counts homework hours for any task that requires mom's approval. Decision file marks this Wired but the wiring only covers the immediate-complete branch.
3. **The `'hourly'` reward type and `'financial_approval'` request source are pure documentation theatre** — CHECK constraints + type unions added to satisfy addendum specs, but no producer or consumer code exists. Adding a CHECK constraint that nothing writes to is harmless, but the addendum reads as if the pathway is real.

## Watch-flag hits

- **F11 (server-side per-tool-per-person enforcement, financial-data-exclusion subset)** — **PASSES**. Convention #225 fully honored. Single best-wired guardrail seen so far in Scope 3+8b audit.
- **Crisis Override duplication** — N/A (no LiLa Edge Function specific to PRD-28 yet; `homeschool_time_review` mode is stubbed)
- **F17 PRD-08 messaging behavior-vs-intent** — N/A
- **F22+F23 PRD-19 reports × archive column drift (PRD-28B Deferred)** — confirmed Deferred-to-Gate-4 per seam #15; no traversal
- **studio_queue handoff `source` discipline** — N/A for PRD-28 (PRD-28 uses `family_requests.source`, not `studio_queue.source`); however cross-addendum pattern flagged in proposed consolidation §5.2 — `family_requests.source` widened by migration 100137 without amending PRD-15 addendum
- **`is_included_in_ai` three-tier propagation (financial data exclusion subset)** — **PASSES**. Financial tables have no `is_included_in_ai` column at all because they are categorically excluded — exclusion enforced at the table-omission level, not at the toggle level. Stronger than a toggle.

## Orchestrator adjudication

(empty — pending walk-through against synthesis doc)
