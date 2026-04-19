# claude/web-sync/ — Claude.ai Web Project Sync

> **Purpose:** Files in this folder are the ones Tenise wants synced to her Claude.ai web project via the GitHub integration. Dropping a file here makes it visible to Claude.ai without manual upload. Removing a file here (or moving it back to its permanent home in the repo) takes it out of active sync.

## How the sync works

Tenise configures her Claude.ai project's GitHub connector to pull this repo. In the project knowledge settings, she scopes the sync to `claude/web-sync/` (or explicitly lists files from it). When she hits refresh on the project, Claude.ai pulls the current state of this folder — no manual file uploads, no copy-paste.

## What belongs here

Only **currently-active coordination or reference docs** that Claude.ai needs for ongoing work. This is a rotating shelf, not an archive:

- A doc lands here when Tenise needs Claude.ai to see it for the current work window.
- A doc leaves here when the work window closes — moved back to its permanent location in the repo, or removed entirely if it was only useful for that phase.

**Good candidates:**
- Active coordination plans (like `AUDIT_PARALLEL_PLAN.md`)
- The currently-active feature decision doc
- Living reference docs for the work in flight (e.g. a draft user-flows doc while Tenise is designing in Claude.ai)
- Any audit/report output Claude.ai is reviewing strategically

**Bad candidates:**
- Stable reference docs that live in their own folders (`claude/architecture.md`, `claude/live_schema.md`, `CLAUDE.md`) — if Claude.ai needs those, scope the sync to include those paths too; don't duplicate.
- Any document with a natural permanent home (PRDs stay in `prds/`, feature decisions in `claude/feature-decisions/`, completed builds in `.claude/completed-builds/`)
- Source code

## What's here right now

| File | Purpose | Active through |
|---|---|---|
| `AUDIT_PARALLEL_PLAN.md` | Coordinates Phase 2 audit (Claude Code) with wizard user-flow design (Claude.ai) | Gate 1 exit + Phase 5 Zod/simplify completion |

## Current Claude.ai sync config (copy these paths)

**Last updated:** 2026-04-18 — scoped for Phase 2 audit + wizard flow design window.

Paste these into your Claude.ai project's GitHub sync settings:

```
claude/web-sync/
claude/feature-decisions/
MYAIM_GAMEPLAN_v2.2.md
RECONNAISSANCE_REPORT_v1.md
RECON_DECISIONS_RESOLVED.md
WIRING_STATUS.md
STUB_REGISTRY.md
```

**Rationale per entry:**

| Path | Why Claude.ai needs it |
|---|---|
| `claude/web-sync/` | This folder — active coordination docs |
| `claude/feature-decisions/` | Existing wizard spec + addendum that flow design builds on |
| `MYAIM_GAMEPLAN_v2.2.md` | Master plan the audit derives from |
| `RECONNAISSANCE_REPORT_v1.md` | Phase 0.25 findings — avoid re-litigating settled issues |
| `RECON_DECISIONS_RESOLVED.md` | 13 founder decisions from recon — authoritative current-state |
| `WIRING_STATUS.md` | What's wired vs stubbed — flow design depends on this |
| `STUB_REGISTRY.md` | Companion to WIRING_STATUS — intentional stubs vs "wired but broken" |

**When to update this list:**
- At the start of each new work window (phase transition, new PRD focus, etc.)
- Whenever a root-level doc becomes relevant to Claude.ai's current work
- Whenever a doc falls off Claude.ai's relevance radar — remove to keep the sync focused

Claude Code updates this section when entering or closing a work window. Tenise opens the README, copies the current list, pastes into Claude.ai project settings.

## Rotation rules

- When a doc rotates out, note it in this README's "What's here right now" table (strike through or remove the row) and commit.
- Don't let files pile up here past their active window — the whole point is that Claude.ai's context stays focused on current work.
- If a doc is persistently useful long-term, it belongs in `claude/reference/` or another permanent folder — not here.
