# Pre-Commit Override Log

> Records every time a pre-commit check was overridden with a reason.
> The orchestrator reads this at session start and surfaces overrides during status reports.
> Entries are append-only. Each entry records the pattern, reason, and timestamp.
>
> To override a banned-pattern check:
> `OVERRIDE_REASON="your explanation" git commit -m "message"`

---

*No overrides recorded yet.*
