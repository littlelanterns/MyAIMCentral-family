# Phase 3.5 Worker B1 — Recalculate Investigation (Amendment 2)

## Context

You are Worker B1 for Phase 3.5 (Multi-Pool Allowance). This is an INVESTIGATION-ONLY worker. You produce a findings report. You do NOT write code.

**Read these files before investigating:**
- `.claude/rules/current-builds/phase-3.5-multi-pool-allowance.md` — active build file (Amendment 2 describes this investigation)
- `claude/feature-decisions/PRD-28-Phase-3.5-Multi-Pool-Allowance.md` — Key Decision 7 (existing recalculate path)

## Why This Investigation Exists

Phase 3.5 builds a recalculate path for multi-pool allowance periods (Amendment 1). At period close, the system stores the combined weighted percentage on `allowance_periods.combined_percentage`. When mom taps "recalculate" on a past period, the system re-runs the math, compares to the stored value, and writes an adjustment `financial_transaction` (positive or negative) per Convention #223 (append-only — no UPDATE, no DELETE).

Before building this, we need to verify the EXISTING single-pool recalculate path works correctly. If it's broken or violates append-only conventions, we fix the foundation before extending it for multi-pool. Building multi-pool recalculate on top of broken single-pool recalculate would compound the problem.

## What To Investigate

### 1. Find the existing recalculate UI and trace the code path

Search for any "recalculate" button, "recalc" action, or period-recompute flow in:
- `src/pages/PrizeBoard.tsx` (the Allowance tab shows past periods)
- `src/features/financial/` (any modals or components)
- `src/hooks/useFinancial.ts` (mutations that touch `allowance_periods`)
- Any other financial/allowance components

Trace from the button click through to the database write. Document every step.

### 2. Answer these three questions

**Q1: Does it actually recompute the period?**
- Does it call `calculate_allowance_progress` RPC with the period's date range?
- Or does it just re-read existing stored values?
- Does it use the same grace_days that were in effect when the period originally closed?

**Q2: Does it write an adjustment transaction, or does it try to UPDATE the existing record?**
- Check if it writes a NEW `financial_transactions` row (correct — append-only per Convention #223)
- Or does it UPDATE `allowance_periods` columns like `calculated_amount`, `total_earned` in place?
- Or does it UPDATE an existing `financial_transactions` row?
- Convention #223 is non-negotiable: `financial_transactions` is append-only. INSERT only. Reversals are new negative `adjustment` records.

**Q3: Does it handle the case where a payment was already made from the original calculation?**
- If mom already paid $8.46 based on the original 60.4% calculation, and recalculate produces 65% ($9.10), what happens?
- Does it know the difference between "amount earned" and "amount paid"?
- Does it create a net adjustment ($0.64 positive) or does it naively overwrite?

### 3. Check the Edge Function side

- `supabase/functions/calculate-allowance-period/index.ts` — does it have a recalculate mode or path?
- Is recalculate handled client-side only, or does it go through the Edge Function?

### 4. Check for any recalculate-related migrations

- Search migrations for any function or trigger related to period recalculation
- Check if there's a `recalculate_allowance_period` RPC or similar

## Deliverable

A findings report with this structure:

```
## Recalculate Path — Current State

### Code path trace
[Step-by-step from button to database]

### Q1: Does it recompute?
[Answer with file paths and line numbers]

### Q2: Append-only compliance
[Answer — does it write adjustments or UPDATE in place?]

### Q3: Post-payment handling
[Answer — does it account for already-paid amounts?]

### Edge Function involvement
[Answer — client-only or Edge Function?]

### Assessment
[One of:]
- CLEAN: existing path is correct, extend for multi-pool
- FIXABLE: broken but fix is small (describe fix)
- BROKEN: significant issues, recommend explicit scoping before B2

### Recommendation for B2
[What B2 should do based on findings]
```

## What NOT To Do

- Do not write any code
- Do not modify any files
- Do not fix anything you find — just report it
- Do not start the RPC rewrite — that's B2
- Do not make assumptions — trace the actual code
