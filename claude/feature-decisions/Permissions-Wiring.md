# PERMISSIONS-WIRING — Feature Decisions & Verification

**Build:** Permission Hub Wiring Audit + Dad Finance/Management Access + Per-Member Sidebar Layer
**Date:** 2026-06-09 | **Founder gate:** decisions collected in-chat, "go" given same day
**Convention:** #274 | **Migration:** 00000000100260 (applied + verified) | **E2E:** `tests/e2e/permissions/permissions-wiring.spec.ts` 12/12 + `role-scoping-leak-pass.spec.ts` 10/10 regression
**Commits:** fec46b2 (2a-2c), db22d6e (2d), efc1dff (2e), 5a74c84 (2f), 73a4b32 (tests)

## Founder decisions (Checkpoint 1 gate)

| # | Decision | Ruling |
|---|----------|--------|
| 1 | Family-level grant shape | Nullable `target_member_id`; NULL = family-wide; partial unique index |
| 2 | Prize Board scope for granted dads | Mom chooses via level: view = read · contribute = + Mark Paid · manage = + Allowance tab |
| 3 | Dad payment notification | Yes, quiet in-app + ledger row attributed to dad |
| 4 | Unwired growth rows (journal, stars, intentions, innerworkings, victories) | Keep in Hub, marked inactive ("takes effect in a future update") |
| 5 | Higgins per-kid row | Remove entirely (revisit at PRD-19) |
| 6 | Special Adult per-kid toggle grid | Hide until shift access ships; Shift Log + Emergency Lock stay; SA Experience build filed |
| 7 | Teen What's Shared panel | Mount in teen Settings + SINGLE SOURCE OF TRUTH (keyWiringStatus registry drives both Hub and panel) |
| 8 | Family-Wide Rules card (3 fake switches) | Remove entirely; no pointer (calendar approval already lives in Calendar Settings; messaging/feed rules ship inside their own sections) |
| 9 | View vs Contribute on wired keys | Tighten now: view = see only; contribute+ = act |
| 10 | Permission change sync timing | On next page move (render-time + query invalidation) |

Also gate-approved: remove per-kid rows for calendar/routines/lila_modal_access/vault_browse/messaging/requests (wrong shape or covered by real systems); seed hygiene (no per-kid settings_basic grants, safe_harbor purged from profiles, profile apply never touches explicit-grant-only keys).

## Phase 1 audit table

The full audit table (every Hub key × consumption site × decision, with the cross-cutting findings: stubbed useCanAccess, unreachable Layer-3 PermissionGate path, unmounted PRD-02 Screens 4+6, fake global toggles, grant-blind AI context correction) lives in the build file: `.claude/rules/current-builds/permissions-wiring.md` (moves to `.claude/completed-builds/2026-06/` at sign-off).

## Post-Build Verification

Copied at close-out from the build file — 37 requirements: **34 Wired, 3 Stubbed (founder-acknowledged), 0 Missing.** Stubs: mom self-restriction enforcement; Special Adult Experience (filed); IndependentShell toast provider (not load-bearing). See the build file for the full row-by-row table and Mom-UI verification status (Playwright-evidenced; founder eyes-on rows pending for granted-dad device flows + Mark Paid click path).

## Notable for future builds

- **Behavior change to expect:** dads with a previously-applied Balanced profile lose Journal/InnerWorkings from their sidebar — that IS mom's configured state (PRD-31); the Hub now displays and controls it truthfully (no-row = On · default).
- **AdultShell was missing RoutingToastProvider entirely** — every adult-shell toast had been a silent noop. Fixed; IndependentShell still lacks it (registered stub).
- **`useMeetings.ts:98` grant check is key-agnostic** (any grant row for a kid unlocks parent_child/mentor meeting creation). Left as-is; tightening is a future choice.
- When wiring a new permission key: flip it in `src/lib/permissions/keyWiringStatus.ts`, wire the surface via `useViewableMembers`/`usePermission`, and add a granted-vs-ungranted Playwright test. Convention #274 has the full contract.
