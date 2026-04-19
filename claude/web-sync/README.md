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

## Claude.ai sync config (one-time setup)

Claude.ai project already has foundational docs (vision, brand, PRDs, condensed intelligence files) as uploaded project knowledge. GitHub sync only needs to cover the **living, evolving** docs that would drift if left as static uploads.

Paste these paths into your Claude.ai project's GitHub sync settings **once**:

```
claude/web-sync/
claude/architecture.md
claude/conventions.md
claude/live_schema.md
claude/feature_glossary.md
claude/ai_patterns.md
CLAUDE.md
BUILD_STATUS.md
WIRING_STATUS.md
STUB_REGISTRY.md
```

**Why each entry:**

| Path | Why it needs to be current |
|---|---|
| `claude/web-sync/` | Active coordination docs Claude Code rotates through this folder |
| `claude/architecture.md` | Evolves as architecture decisions land |
| `claude/conventions.md` | Grows as conventions add (#1 through #245 and counting) |
| `claude/live_schema.md` | Regenerates after every migration via `npm run schema:dump` |
| `claude/feature_glossary.md` | Current canonical glossary — supersedes the v1 planning-era upload in project knowledge |
| `claude/ai_patterns.md` | LiLa architecture + cost optimization patterns in current form |
| `CLAUDE.md` | Project entry point, conventions root |
| `BUILD_STATUS.md` | Which phases/builds are signed off (updated per Convention #14) |
| `WIRING_STATUS.md` | What's wired end-to-end vs stubbed |
| `STUB_REGISTRY.md` | Intentional stubs vs "wired but broken" |

**When this list changes:** Rarely. Only if a new always-current living doc enters the repo (or one above is retired). Claude Code updates this section when that happens; Tenise re-adds the path in Claude.ai settings. Normal work doesn't trigger updates here.

**When you delete from Claude.ai project knowledge** (because GitHub sync now provides the current version):
- Any file whose GitHub-synced version is listed above — delete the uploaded copy to prevent stale/current drift.

## Rotation rules

- When a doc rotates out, note it in this README's "What's here right now" table (strike through or remove the row) and commit.
- Don't let files pile up here past their active window — the whole point is that Claude.ai's context stays focused on current work.
- If a doc is persistently useful long-term, it belongs in `claude/reference/` or another permanent folder — not here.
