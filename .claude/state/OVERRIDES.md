# Pre-Commit Override Log

> Records every time a pre-commit check was overridden with a reason.
> The orchestrator reads this at session start and surfaces overrides during status reports.
> Entries are append-only. Each entry records the pattern, reason, and timestamp.
>
> To override a banned-pattern check:
> `OVERRIDE_REASON="your explanation" git commit -m "message"`

---

*No overrides recorded yet.*

## 2026-05-01 18:19 — Pre-commit override
- **Reason:** useRoutineWeekView.ts: date is explicitly UTC-constructed via T12:00:00Z + setUTCDate — same pattern as existing line 134 in same file
- **Staged files with violations:** see commit diff
