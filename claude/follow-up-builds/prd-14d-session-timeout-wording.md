# PRD-14D §Screen 5 Line 335 — Session Timeout Wording Cleanup

**Status:** Follow-up build candidate — not yet scoped
**Filed:** 2026-05-28
**Filed from:** View As Identity-Scope Architecture build (Convention #39 rewrite finding)
**Estimated workers:** 1 (very small)
**Estimated calendar time on branch:** under 1 hour
**Live-app downtime:** zero (PRD edit only, no code)

---

## What this build is for

Update a single line of PRD-14D wording so the spec matches actual platform behavior. Currently PRD-14D §Screen 5 line 335 says hub session timeout follows "PRD-01 session management settings" — but PRD-01 role-based session durations (adult=24h, independent=4h, guided=1h, play=30m) are intentionally unenforced per the View As Identity-Scope Architecture decision. The actual session boundary for hub flows is the 15-minute modal-only timer added in that build.

This is a documentation-only fix. No code changes.

---

## Why we're doing it

During Convention #39 rewrite in the View As Identity-Scope Architecture build, the orchestrator flagged that PRD-14D §Screen 5 promises behavior the code doesn't deliver:

> "PRD-14D §Screen 5 line 335 promises 'Session timeout returns to Hub per PRD-01 session management settings.' PRD-01 timeouts aren't actually enforced (adult=0). The new 15-min modal-only timer is the first actual session-end enforcement in the hub flow. Worth your awareness."

PRDs are the source of truth in this codebase (Convention #11). A PRD that promises behavior the code doesn't ship is a contract drift. Future workers reading PRD-14D will write code assuming PRD-01 enforcement exists, get confused when it doesn't, and either re-implement the assumption from scratch or file the same finding over again.

The wording update closes the contract drift in one edit. No architectural change, just truth-in-spec.

---

## Strategy

Single worker. Single file edit. Optional companion convention note.

### The edit

PRD-14D §Screen 5 line 335 currently reads (approximate — worker verifies exact wording):

> "Session timeout returns to Hub per PRD-01 session management settings."

Replace with wording that matches actual behavior. Suggested:

> "Session timeout closes the View As modal after 15 minutes of inactivity, with a 2-minute warning at 13 minutes. The hub flow returns to the member-access screen when the modal closes. Role-based session durations specified in PRD-01 §Session Management are not enforced for hub flows; the modal-only timer is the canonical session boundary. See Convention #39."

Worker confirms exact source text first and adjusts proposed wording to match PRD-14D's surrounding tone.

### Companion: cross-reference Convention #39

If Convention #39 doesn't already cross-reference PRD-14D, add a line in the convention text noting that PRD-14D §Screen 5 describes the hub-specific application of this timeout pattern.

---

## Blockers / prerequisites

- **View As Identity-Scope Architecture build must close first.** This wording update assumes the 15-min modal timer is shipped and Convention #39 is the new authoritative reference. Updating PRD-14D before those land would create the opposite contract drift.

---

## What NOT to do

- **Touch any code.** This is a PRD edit only. If a worker is tempted to also "while I'm in here" fix something else, stop. Open a separate scoped item.
- **Modify PRD-01.** PRD-01's session durations are a deliberate spec; they're just not enforced today. The drift is in PRD-14D claiming they are, not in PRD-01 itself.
- **Delete the old wording without preserving the reasoning.** The replacement should explain WHY the modal timer is the boundary (no per-role Supabase session to expire — see Convention #39 migration anchor), not just state the new behavior. Future readers need to understand the design choice.

---

## Open questions for the founder at dispatch time

1. **Do other PRDs reference PRD-01 session management as if it's enforced?** Worker should grep the `prds/` directory for "session management" and "PRD-01" together. Other drifts may exist. If found, fix them in this build or file separately?
2. **Should PRD-01 itself get a note that role-based session durations are intentionally unenforced today?** (Recommendation: yes, one line in PRD-01 §Session Management noting "These durations are the design intent. Current implementation enforces only the View-As modal-only timer per Convention #39. Future per-kid Supabase auth would enable per-role enforcement.")

---

## Related

- **Convention #39** — View As architecture; defines the 15-min modal-only timer as the canonical session boundary
- **PRD-01** — defines role-based session durations (intent; not enforced today)
- **PRD-14D** — Family Hub spec; the file being edited
- **View As Identity-Scope Architecture build** — surfaced the wording drift during Convention #39 rewrite
