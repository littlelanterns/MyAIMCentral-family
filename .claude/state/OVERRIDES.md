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

## 2026-07-07 10:32 — Pre-commit override
- **Reason:** Secret-scanner false positive: the flagged string is a deliberately FORGED JWT test fixture (tests/e2e/features/voice-and-endpoint-auth.spec.ts:37-40, nil-UUID payload + literal 'not_a_real_signature') used to prove extract-insights now REJECTS forged/unsigned tokens after the auth fix. Not a real credential — the regex matches any JWT-shaped string by its common header prefix.
- **Staged files with violations:** see commit diff
