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
| `TRIAGE_WORKSHEET.md` | Phase 3 Triage locked worksheet (183/183 classifications) | Gate 1 exit (Phase 4 dispatches consume it, Phase 5 references it) |
| `FIX_NOW_SEQUENCE.md` | Wave execution DAG (v11) for Phase 4 Fix Now + Beta=Y resolution | Gate 1 exit |
| `AUDIT_REPORT_v1.md` | Phase 2 audit report — 146 findings + 24 deltas across 7 scopes | Gate 1 exit (source for every triage row) |
| `MYAIM_GAMEPLAN_v2.2.md` | Master gameplan — phase/gate structure, "what phase are we in" orientation | Gate 2 complete (then revisit for v2.3 cut) |
| `Composition-Architecture-and-Assembly-Patterns.md` | Load-bearing architecture doc — source for Conventions 249-256 and worksheet rows NEW-F through NEW-CC; reference for Gate 2 wizard builds | Gate 2 complete |
| `RECON_GENERAL_MODE_SURFACES.md` | Recon-2 inventory of 10 user-facing General-mode surfaces — blocks NEW-B execution; informs PRD-05 addendum | PRD-05 addendum lands + NEW-B Fix Now executes |
| `CLIENT_DATE_AUDIT_2026-04-23.md` | Client-computed date bug class audit — 7 vulnerable tables + 8 filter sites; source doc for Convention 257 and worksheet Row 184 NEW-DD (Wave 1, Beta=Y) | NEW-DD remediation lands |

## Claude.ai sync config (one-time setup)

Claude.ai project already has foundational docs (vision, brand, PRDs, condensed intelligence files) as uploaded project knowledge. GitHub sync only needs to cover the **living, evolving** docs that would drift if left as static uploads.

Paste these paths into your Claude.ai project's GitHub sync settings **once**:

```
claude/web-sync/
claude/feature-decisions/
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
| `claude/feature-decisions/` | Tenise's per-feature decision files (Universal-Setup-Wizards, addenda, etc.) — living docs that evolve with design decisions |
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
