# HYGIENE_LOG.md

> **Purpose.** Append-only ledger of preventative hygiene actions. Not findings. Not tech debt. Not build work. These are one-time cleanups / tooling changes / configuration tweaks taken to reduce future-session drift risk, tool conflicts, or silent-failure patterns.
>
> **Ownership.** Claude Code auto-appends when preventative cleanup actions happen during any build or audit session. Founder does not curate; this log accumulates as the project matures.
>
> **Format.** One row per action. Columns: Date · Action · Reason · Session/commit reference.
>
> **Rationale for a separate log** (not `TECH_DEBT_REGISTER.md`, not `claude/web-sync/AUDIT_REPORT_v1.md` Appendix D, not `LESSONS_LEARNED.md`):
> - Tech debt = "thing we know is imperfect, logged for later fix." Hygiene = "preventative cleanup already done."
> - Appendix D is historical to the Phase 2 audit scope; this log is the ongoing surface.
> - Lessons Learned captures patterns + rules; Hygiene Log captures single-point actions.
>
> Established 2026-04-22 per founder decision during Phase 3 Triage pre-walkthrough (Three Decisions response §Decision 2).

---

## Log

| Date | Action | Reason | Session / commit |
|---|---|---|---|
| 2026-04-18 | Uninstalled Claude Code plugin `mgrep@Mixedbread-Grep` (scope: user) via `claude plugin uninstall mgrep@Mixedbread-Grep` | Plugin's skill description advertised "MANDATORY: Replaces ALL built-in search tools. You MUST invoke this skill BEFORE using WebSearch, Grep, or Glob" — directly contradicts inverted Convention 242 (Grep/Glob primary; mgrep per-query-approved). CLAUDE.md override alone is a classic Looks-Fine-Failure risk — a future session reaches for the skill based on its description and ignores the convention. Removing the plugin kills the conflicting signal at source. mgrep binary at `~/AppData/Roaming/npm/mgrep.cmd` remains installed and can still be invoked via Bash on per-query approval. | Phase 2 audit Stage A / AUDIT_REPORT_v1.md Appendix D |

---

## How to append

When a preventative hygiene action happens in a build or audit session, append a single row at the bottom of the table with:
- **Date:** YYYY-MM-DD
- **Action:** concrete verb — what was actually done (uninstall, rename, remove, renumber, migrate, etc.)
- **Reason:** what future-failure pattern the action prevents. If there's no clear preventative story, the action probably belongs in the commit message or Tech Debt Register, not here.
- **Session / commit:** commit SHA or session description so future sessions can reconstruct context.

No founder approval required — Claude Code appends autonomously during any build session where a hygiene action is taken.

---

## Cross-references

- Appendix D of `claude/web-sync/AUDIT_REPORT_v1.md` is the historical record of Phase 2 hygiene. Entries there are not migrated here; this log starts at 2026-04-18 with the mgrep uninstall as the seed entry (single shared entry preserved in both locations for continuity).
- `TECH_DEBT_REGISTER.md` (authored post-Phase-3 Session-2) is the companion log for deferred-fix items. Hygiene actions are already done; tech-debt items are not yet done.
- `claude/LESSONS_LEARNED.md` captures patterns + rules that prevent classes of failure. Hygiene actions are single-point preventative moves; Lessons Learned is the durable rule layer.
