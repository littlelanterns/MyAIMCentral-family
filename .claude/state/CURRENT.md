# Current State — As of 2026-06-08

## Active builds
- **None in flight.** `.claude/rules/current-builds/` holds only `IDLE.md`.

## Last completed
- **Member-Day Task State — Single Source of Truth** (2026-06-08, commit `6143b5a`, migration 100247) — fixed silent allowance erosion from past-end-date painted routines; canonical `get_member_day_obligations`/`obligation_active_for_member_on_date`; Convention #271; invariant test guards TS↔SQL drift. Checkpoint 5: 12/12 Wired, 0 Missing.
- View-As — Identity-Scope Architecture (2026-06-04)
- PRD-09B — Living Shopping List & Shopping Mode V1 (2026-06-04; code shipped 2026-05-04 `f2569b7`)
- TaskCreationModal — Checkbox Honesty (2026-06-04; code shipped 2026-05-25 `970e175`)
- Phase 3.5 — Multi-Pool Allowance (2026-05-06)
- Phase 3.8 — Activity Management (2026-05-05)

## Open follow-ups carried from last close-out
- **Member-Day deltas:** founder to capture per-kid old→corrected allowance numbers (Gideon/Miriam/Mosiah) during this-week testing; decide honor-old-vs-corrected per kid. Default: corrected.
- **Convention #271 grandfathered surfaces:** refactor into `get_member_day_obligations` when next touched (gamification `roll_creature_for_completion`, homework time logs, victory creation, tracker widget events, intention tallies, practice log, non-routine task derivations, `countAssignedTasks` non-routine portion). See `STUB_REGISTRY.md` → "Member-Day Obligations — Grandfathered".
- **Layer 2 source_type extension:** future builds add non-routine `source_type` values one at a time.
- **Orphan-row sweep:** find/prevent the deploy flow that creates `assignee_id=NULL` routine rows.
- Pre-build pending: none. (Member-Day build file moved to completed-builds.)

## Open queues
- Beta glitch reports: check via `/bug-reports` or query `beta_glitch_reports`
- TRIAGE_WORKSHEET: check `claude/web-sync/TRIAGE_WORKSHEET.md`

---
*This file is overwritten at every close-out and every baton-pass. For history, see HISTORY.md.*
