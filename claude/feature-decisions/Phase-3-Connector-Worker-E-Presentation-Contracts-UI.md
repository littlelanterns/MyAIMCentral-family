# Phase 3 — Worker E: Presentation Layer + Contract Authoring UI

## Source Material Read

| Document | Path | Sections |
|----------|------|----------|
| Pre-Build Process | `claude/PRE_BUILD_PROCESS.md` | Full |
| Connector Build Plan | `claude/web-sync/Connector-Build-Plan-2026-04-26.md` | §6.2 items 16-17 |
| Rewards Ground Truth | `claude/web-sync/REWARDS_GROUND_TRUTH_2026-04-25.md` | §3 (reward_reveals architecture) |
| Connector Architecture | `claude/web-sync/Connector-Architecture-and-Routing-Model.md` | §8, §9 |
| Parallel Builder Brief | `claude/web-sync/Parallel-Builder-Coordination-Brief-2026-04-26.md` | §2.5, §2.10 |
| Worker A+B Build File | `.claude/rules/current-builds/phase-3-connector-worker-ab.md` | Full |
| Live Schema | `claude/live_schema.md` | contract_grant_log, contracts, deed_firings |
| Existing Reveal Hooks | `src/hooks/useRewardReveals.ts` | Full (601 lines) |
| RewardRevealModal | `src/components/reward-reveals/RewardRevealModal.tsx` | Full |
| PrizeBoard | `src/pages/PrizeBoard.tsx` | Full |
| Dispatch RPC | `supabase/migrations/00000000100207_allowance_godmother.sql` | Updated dispatch_godmothers |
| Family Victory Godmother | `supabase/migrations/00000000100213_family_victory_godmother.sql` | Full (pattern reference) |

## Scope — Sub-Tasks 16, 16b, 17

### Sub-Task 16: Presentation Layer

Wire `presentation_mode` on contracts to existing reveal infrastructure so kids SEE the result of godmother grants.

### Sub-Task 16b: Recognition Godmother (10th)

A godmother that does nothing transactional — logs acknowledgment only. Enables "no reward, just presentation" contracts (e.g., potty trip → coloring advance only).

### Sub-Task 17: Mom Contract Authoring UI

CRUD form for creating/editing/pausing/deleting contracts. Power-user interface (functional, not pretty). Wizards come in Phase 3.7.

---

## Key Decisions

### D1: Extend contract_grant_log vs new pending_reveals table

**Decision: Extend contract_grant_log** (per dispatch prompt recommendation).

Add 4 columns:
- `family_member_id UUID` — copied from deed_firing at grant time (enables member-scoped queries)
- `presentation_mode TEXT` — copied from contract at grant time
- `animation_slug TEXT` — resolved animation for the reveal
- `revealed_at TIMESTAMPTZ` — NULL until frontend shows it

Frontend query: `WHERE family_member_id = X AND presentation_mode NOT IN ('silent') AND revealed_at IS NULL AND status = 'granted'`

**Why:** Avoids a separate table when contract_grant_log already has one row per grant. The 4 new columns are lightweight and only populated for non-silent grants.

### D2: Coloring advance is a 6th presentation_mode value

**Decision:** Add `'coloring_advance'` to the contracts.presentation_mode CHECK constraint.

When presentation dispatches and finds `presentation_mode = 'coloring_advance'`:
- Call `advance_coloring_reveal()` RPC for the kid's active reveal
- Frontend `ColorRevealTallyWidget` already handles rendering

### D3: recognition_godmother follows family_victory_godmother pattern

**Decision:** Same function signature, returns `{status: 'granted'}` (not `'no_op'` — recognition IS the grant). ~20 lines of SQL.

### D4: Contract authoring lives at /contracts in Plan & Do sidebar section

**Decision:** Dedicated page, not buried in settings. Mom-only. In sidebar next to Prize Board.

### D5: Presentation dispatch happens in updated dispatch_godmothers RPC

**Decision:** After the godmother returns `{status: 'granted'}`, the dispatch RPC writes presentation columns to contract_grant_log. The SQL already writes to grant_log — we extend the INSERT to include presentation fields copied from the contract.

This keeps presentation logic server-side (in the dispatch RPC), not duplicated in each godmother.

### D6: Override mode defaults to 'replace'

Per Coordination Brief §2.5. UI shows the choice when creating kid-level or deed-level contracts.

---

## Schema Changes (Migration 100216)

### ALTER contracts — add recognition_godmother + coloring_advance

```sql
-- Add recognition_godmother to godmother_type CHECK
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_godmother_type_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_godmother_type_check
  CHECK (godmother_type IN (
    'allowance_godmother', 'numerator_godmother', 'money_godmother',
    'points_godmother', 'prize_godmother', 'victory_godmother',
    'family_victory_godmother', 'custom_reward_godmother',
    'assign_task_godmother', 'recognition_godmother'
  ));

-- Add coloring_advance to presentation_mode CHECK
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_presentation_mode_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_presentation_mode_check
  CHECK (presentation_mode IN ('silent', 'toast', 'reveal_animation', 'treasure_box', 'coloring_advance'));
```

### ALTER contract_grant_log — add presentation columns

```sql
ALTER TABLE public.contract_grant_log
  ADD COLUMN IF NOT EXISTS family_member_id UUID REFERENCES public.family_members(id),
  ADD COLUMN IF NOT EXISTS presentation_mode TEXT,
  ADD COLUMN IF NOT EXISTS animation_slug TEXT,
  ADD COLUMN IF NOT EXISTS revealed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS contract_grant_log_pending_reveals_idx
  ON public.contract_grant_log (family_member_id, presentation_mode)
  WHERE presentation_mode IS NOT NULL AND presentation_mode != 'silent' AND revealed_at IS NULL AND status = 'granted';
```

### New RPC: execute_recognition_godmother

Same pattern as execute_family_victory_godmother but returns `{status: 'granted'}`.

### Updated dispatch_godmothers RPC

After godmother invocation, copy `presentation_mode`, `animation_slug` from contract + `family_member_id` from deed_firing into the contract_grant_log INSERT.

---

## Frontend Components

### New: usePendingReveals(memberId)

- Subscribes to Supabase Realtime on `contract_grant_log` filtered by member
- Returns pending reveals (granted, non-silent, not yet revealed)
- On reveal shown → UPDATE `revealed_at = NOW()`
- Wired into MomShell, GuidedShell, PlayShell via a `PendingRevealsProvider`

### New: ContractsPage (/contracts)

- List view: cards grouped by member (NULL = family default), with inheritance nesting
- Create/Edit form: 6 collapsible sections (Deed, IF, Godmother, Timing, Presentation, Inheritance)
- Delete/Restore: 48h recovery window
- Member pill picker, source type icons, godmother type icons
- Filter by member, godmother_type, source_type

### Modified: Sidebar.tsx

Add `/contracts` entry in Plan & Do section (mom shell only), near Prize Board.

### Modified: App.tsx (or routing)

Add route for `/contracts` → `ContractsPage`.

---

## What NOT to Build (Stubs/Deferred)

| Item | Why |
|------|-----|
| Calendar IF pattern evaluation | Deferred to Phase 3.5 (rrule parsing in SQL) |
| Custom stroke_of schedule | Stubbed with "coming in Phase 3.5" |
| Wizard-guided contract creation | Phase 3.7 scope |
| Multi-pool configuration UI | Phase 3.5 scope |
| Reveal animation asset uploads | Existing 14+ animations sufficient |
| CreatureRevealModal / PageUnlockRevealModal | Build M Sub-phase D scope |

---

## Constraints

- DO NOT modify BookShelf files
- DO NOT modify 4 gamification hook sites (Worker F)
- DO NOT modify godmother implementations (Workers C+D)
- DO NOT rebuild reveal infrastructure — wire existing
- One commit per sub-task
- Run `tsc -b` after every commit
- Convention #246 for any cron wiring
- Mobile/desktop parity on /contracts page

---

## Post-Build Verification Table

*(To be filled after build)*

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| | | | |
